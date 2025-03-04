import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Trash2, Save, Loader2, ArrowUp, ArrowDown, ChevronRight, Edit, Download, Database, SortAsc, Upload, CheckCircle, FileText, LogOut, ChevronLeft } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface IMBFormData {
  nomorBerkas: string;
  kodeKlasifikasi: string;
  peruntukan: string;
  nama: string;
  alamat: string;
  nomorIMB: {
    inputan1: string;
    jenis: 'format1' | 'format2';
    bulan: string;
    tahun: string;
  };
  kurunWaktu: string;
  tingkatPerkembangan: string;
  jmlBerkas: string;
  kondisiArsip: string;
  noBox: string;
  file: string;
  keterangan: string;
}

interface SheetData {
  values: string[][];
}

const MONTHS_ROMAN = {
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '5': 'V',
  '6': 'VI',
  '7': 'VII',
  '8': 'VIII',
  '9': 'IX',
  '10': 'X',
  '11': 'XI',
  '12': 'XII'
};

const INITIAL_FORM_DATA: IMBFormData = {
  nomorBerkas: '',
  kodeKlasifikasi: '600.2.8',
  peruntukan: '',
  nama: '',
  alamat: '',
  nomorIMB: {
    inputan1: '',
    jenis: 'format1',
    bulan: '1',
    tahun: new Date().getFullYear().toString()
  },
  kurunWaktu: '',
  tingkatPerkembangan: 'Asli',
  jmlBerkas: '1 Berkas',
  kondisiArsip: 'Baik',
  noBox: '',
  file: '',
  keterangan: ''
};

function App() {
  const [formData, setFormData] = useState<IMBFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isGisLoaded, setIsGisLoaded] = useState(false);

  // Load GIS
  useEffect(() => {
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.onload = () => {
      console.log('GIS script loaded successfully');
      setIsGisLoaded(true);
    };
    gisScript.onerror = () => {
      console.error('Failed to load GIS script');
      toast.error('Gagal memuat Google Identity Services');
    };
    document.body.appendChild(gisScript);

    return () => document.body.removeChild(gisScript);
  }, []);

  // Inisialisasi token dari localStorage saat GIS loaded
  useEffect(() => {
    if (isGisLoaded) {
      const savedToken = localStorage.getItem('googleAccessToken');
      const expirationTime = localStorage.getItem('tokenExpiration');
      const now = Date.now();
      console.log('Cek token di useEffect:', savedToken, 'Expiration:', expirationTime, 'Now:', now);
      if (savedToken && expirationTime && now < parseInt(expirationTime)) {
        setToken(savedToken);
        loadSheetsAPI();
      } else {
        setToken(null); // Jangan hapus dari localStorage di sini, biarkan sampai logout eksplisit
      }
    }
  }, [isGisLoaded]);

  const loadSheetsAPI = () => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.onload = () => {
      console.log('GAPI script loaded');
      initializeSheetsAPI();
    };
    script.onerror = () => toast.error('Gagal memuat Sheets API');
    document.body.appendChild(script);
  };

  const initializeSheetsAPI = () => {
    window.gapi.load('client', async () => {
      try {
        console.log('Initializing GAPI client with token:', token);
        await window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        if (token) {
          window.gapi.client.setToken({ access_token: token });
        }
        console.log('GAPI client initialized successfully');
        setIsInitialized(true);
        if (token) await loadSheets(); // Hanya load sheets jika sudah ada token
      } catch (error) {
        console.error('Failed to initialize Sheets API:', error);
        toast.error('Gagal menginisialisasi Sheets API');
      }
    });
  };

  const handleGoogleLogin = () => {
    if (!isGisLoaded || !window.google) {
      console.error('Google Identity Services not available');
      toast.error('Google Identity Services belum siap.');
      return;
    }

    setIsLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (response: any) => {
        setIsLoading(false);
        if (response.error) {
          toast.error('Gagal login: ' + response.error);
          return;
        }
        const accessToken = response.access_token;
        const expiresIn = response.expires_in;
        const expirationTime = Date.now() + expiresIn * 1000;

        setToken(accessToken); // Pastikan state token diperbarui
        localStorage.setItem('googleAccessToken', accessToken);
        localStorage.setItem('tokenExpiration', expirationTime.toString());
        console.log('Login sukses - Token:', accessToken, 'Expiration:', expirationTime);
        loadSheetsAPI(); // Inisialisasi ulang setelah login
      },
    });
    client.requestAccessToken();
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('tokenExpiration');
    setIsInitialized(false);
    setAvailableSheets([]);
    setSheetData(null);
    toast.success('Logged out successfully');
  };

  const loadSheets = async () => {
    if (!token) return; // Jangan load sheets jika belum login
    try {
      setIsLoading(true);
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
      });
      const sheets = response.result.sheets?.map((sheet: any) => sheet.properties.title) || [];
      console.log('Sheets loaded:', sheets);
      setAvailableSheets(sheets);
      if (sheets.length > 0 && !selectedSheet) {
        setSelectedSheet(sheets[0]);
        await loadSheetData(sheets[0]);
      }
    } catch (error: any) {
      console.error('Error loading sheets:', error);
      if (error.result?.error?.code === 401) {
        toast.error('Sesi login kedaluwarsa. Silakan login ulang.');
        handleLogout();
      } else {
        toast.error('Gagal memuat daftar sheet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetData = async (sheetName: string) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
        range: `${sheetName}!A:M`,
      });
      const newData = { values: response.result.values || [] };
      setSheetData((prev) => (JSON.stringify(prev?.values) !== JSON.stringify(newData.values) ? newData : prev));
    } catch (error: any) {
      console.error('Error loading sheet data:', error);
      if (error.result?.error?.code === 401) {
        toast.error('Sesi login kedaluwarsa. Silakan login ulang.');
        handleLogout();
      } else {
        toast.error('Gagal memuat data sheet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSheet = e.target.value;
    setSelectedSheet(newSheet);
    if (newSheet && token) {
      await loadSheetData(newSheet);
    }
  };

  const generateIMBNumber = () => {
    const { inputan1, jenis, bulan, tahun } = formData.nomorIMB;
    return jenis === 'format1'
      ? `${inputan1}/BPPTSP-KS/IMB/C/BN,PB&PF/${MONTHS_ROMAN[bulan as keyof typeof MONTHS_ROMAN]}/${tahun}`
      : `${inputan1}/BPPTSP-KS/IMB/C/${MONTHS_ROMAN[bulan as keyof typeof MONTHS_ROMAN]}/${tahun}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheet) {
      toast.error('Pilih sheet terlebih dahulu');
      return;
    }

    const savedToken = localStorage.getItem('googleAccessToken');
    const expirationTime = localStorage.getItem('tokenExpiration');
    console.log('Token saat submit:', token, 'Saved token:', savedToken, 'Expiration:', expirationTime);

    if (!savedToken) {
      toast.error('Silakan login terlebih dahulu untuk menyimpan data');
      return;
    }

    if (expirationTime && Date.now() > parseInt(expirationTime)) {
      toast.error('Sesi login telah kedaluwarsa. Silakan login ulang.');
      handleLogout();
      return;
    }

    // Pastikan token di state sinkron dengan localStorage
    if (token !== savedToken) {
      setToken(savedToken);
      window.gapi.client.setToken({ access_token: savedToken });
    }

    try {
      setIsLoading(true);
      const fullIMBNumber = generateIMBNumber();
      const rowData = [
        formData.nomorBerkas,
        formData.kodeKlasifikasi,
        formData.peruntukan,
        formData.nama,
        formData.alamat,
        fullIMBNumber,
        formData.kurunWaktu,
        formData.tingkatPerkembangan,
        formData.jmlBerkas,
        formData.kondisiArsip,
        formData.noBox,
        formData.file,
        formData.keterangan,
      ];

      const nextRow = (sheetData?.values?.length || 0) + 1;
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
        range: `${selectedSheet}!A${nextRow}`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: [rowData] },
      });

      toast.success('Data berhasil disimpan');
      await loadSheetData(selectedSheet);
    } catch (error: any) {
      console.error('Error saving data:', error);
      if (error.result?.error?.code === 401) {
        toast.error('Sesi login telah kedaluwarsa. Silakan login ulang.');
        handleLogout();
      } else {
        toast.error(`Gagal menyimpan data: ${error.result?.error?.message || 'Kesalahan tidak diketahui'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRow = async (rowIndex: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      setIsLoading(true);
      if (!selectedSheet) throw new Error('No sheet selected');
      console.log('Selected sheet:', selectedSheet);

      const sheetResponse = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
      });
      console.log('Spreadsheet response:', sheetResponse.result);

      const sheets = sheetResponse.result.sheets || [];
      console.log('Available sheets:', sheets.map((s: any) => s.properties.title));
      const sheet = sheets.find((s: any) => s.properties.title === selectedSheet);
      const sheetId = sheet?.properties.sheetId;

      if (!sheet || !sheetId) throw new Error(`Sheet ID not found for sheet: ${selectedSheet}`);
      console.log('Sheet ID found:', sheetId);

      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });

      toast.success('Data berhasil dihapus');
      await loadSheetData(selectedSheet);
    } catch (error: any) {
      console.error('Error deleting row:', error.message);
      toast.error('Gagal menghapus data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const moveRowUp = async (rowIndex: number) => {
    if (rowIndex <= 1 || !sheetData) return; // Baris pertama (header) tidak bisa naik

    try {
      setIsLoading(true);
      const sheetsResponse = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
      });
      const sheet = sheetsResponse.result.sheets?.find((s: any) => s.properties.title === selectedSheet);
      const sheetId = sheet?.properties.sheetId;

      if (!sheetId) throw new Error('Sheet ID not found');

      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
        resource: {
          requests: [
            {
              moveDimension: {
                source: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
                destinationIndex: rowIndex - 1,
              },
            },
          ],
        },
      });

      toast.success('Baris berhasil dipindah ke atas');
      await loadSheetData(selectedSheet);
    } catch (error: any) {
      console.error('Error moving row up:', error);
      toast.error('Gagal memindah baris ke atas');
    } finally {
      setIsLoading(false);
    }
  };

  const moveRowDown = async (rowIndex: number) => {
    if (!sheetData || rowIndex >= sheetData.values.length - 1) return; // Baris terakhir tidak bisa turun

    try {
      setIsLoading(true);
      const sheetsResponse = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
      });
      const sheet = sheetsResponse.result.sheets?.find((s: any) => s.properties.title === selectedSheet);
      const sheetId = sheet?.properties.sheetId;

      if (!sheetId) throw new Error('Sheet ID not found');

      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
        resource: {
          requests: [
            {
              moveDimension: {
                source: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
                destinationIndex: rowIndex + 2, // +2 karena ke posisi setelah baris berikutnya
              },
            },
          ],
        },
      });

      toast.success('Baris berhasil dipindah ke bawah');
      await loadSheetData(selectedSheet);
    } catch (error: any) {
      console.error('Error moving row down:', error);
      toast.error('Gagal memindah baris ke bawah');
    } finally {
      setIsLoading(false);
    }
  };

  const sortByIMB = () => {
    if (!selectedSheet || !sheetData || sheetData.values.length <= 1) {
      toast.error('Tidak ada data untuk diurutkan');
      return;
    }
  
    try {
      setIsLoading(true);
      console.log("Sorting by IMB prefix on sheet:", selectedSheet);
  
      // Salin data untuk sorting
      const dataToSort = [...sheetData.values];
      const header = dataToSort[0]; // Simpan header
      const rows = dataToSort.slice(1); // Ambil baris data
  
      // Urutkan baris berdasarkan prefix numerik dari Nomor IMB (kolom indeks 5)
      rows.sort((a, b) => {
        const imbA = a[5] || ''; // Kolom Nomor IMB (indeks 5)
        const imbB = b[5] || '';
        
        // Ambil bagian numerik awal sebelum tanda "/"
        const numA = parseInt(imbA.split('/')[0], 10) || 0;
        const numB = parseInt(imbB.split('/')[0], 10) || 0;
        
        return numA - numB; // Urutkan ascending
      });
  
      // Gabungkan header dan data yang sudah diurutkan
      const sortedData = [header, ...rows];
      setSheetData({ values: sortedData });
      console.log("Sorted data by IMB prefix:", sortedData);
  
      toast.success('Data berhasil diurutkan berdasarkan Nomor IMB');
    } catch (error: any) {
      console.error('Error sorting by IMB:', error);
      toast.error('Gagal mengurutkan data: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span>Menghubungkan ke Google Sheets...</span>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isLoading || !isGisLoaded}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Login dengan Google
        </button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-6">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6 border border-gray-200">
          <div className="bg-blue-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-white" />
                <h1 className="text-xl font-bold">Form Input Data IMB</h1>
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="text-gray-800 text-sm rounded-md border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
                  value={selectedSheet}
                  onChange={handleSheetChange}
                  disabled={isLoading}
                >
                  <option value="">Pilih Sheet</option>
                  {availableSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white py-1.5 px-3 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
                {isLoading && <Loader2 className="w-5 h-5 animate-spin text-white" />}
              </div>
            </div>
          </div>
  
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nomor Berkas/Sampul <span className="text-gray-400">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.nomorBerkas}
                    onChange={(e) => setFormData({ ...formData, nomorBerkas: e.target.value })}
                    placeholder="Masukkan nomor berkas"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Peruntukan</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.peruntukan}
                    onChange={(e) => setFormData({ ...formData, peruntukan: e.target.value })}
                    placeholder="Masukkan peruntukan"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Alamat</label>
                  <textarea
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Masukkan alamat lengkap"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Kode Klasifikasi</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.kodeKlasifikasi}
                    onChange={(e) => setFormData({ ...formData, kodeKlasifikasi: e.target.value })}
                    placeholder="Masukkan kode klasifikasi"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nama</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })}
                    placeholder="Masukkan nama (otomatis kapital)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kurun Waktu</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      value={formData.kurunWaktu}
                      onChange={(e) => setFormData({ ...formData, kurunWaktu: e.target.value })}
                      placeholder="Masukkan kurun waktu"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tingkat Perkembangan</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      value={formData.tingkatPerkembangan}
                      onChange={(e) => setFormData({ ...formData, tingkatPerkembangan: e.target.value })}
                      placeholder="Masukkan tingkat"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* IMB Number Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-5">
              <div className="flex items-center text-blue-800 mb-2">
                <FileText className="w-4 h-4 mr-1" />
                <label className="text-sm font-medium">Nomor IMB</label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Format IMB</label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.nomorIMB.jenis}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomorIMB: { ...formData.nomorIMB, jenis: e.target.value as 'format1' | 'format2' },
                      })
                    }
                  >
                    <option value="format1">Format 1 (BN,PB&PF)</option>
                    <option value="format2">Format 2 (standar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nomor Input</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.nomorIMB.inputan1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomorIMB: { ...formData.nomorIMB, inputan1: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bulan (Romawi)</label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.nomorIMB.bulan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomorIMB: { ...formData.nomorIMB, bulan: e.target.value },
                      })
                    }
                  >
                    {Object.entries(MONTHS_ROMAN).map(([num, roman]) => (
                      <option key={num} value={num}>
                        {roman} ({num})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tahun</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.nomorIMB.tahun}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomorIMB: { ...formData.nomorIMB, tahun: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-2 bg-white p-2 rounded border border-blue-100">
                <p className="text-sm text-blue-800 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Preview: </span>
                  <span className="font-mono ml-2 bg-blue-700 text-white px-2 py-0.5 rounded text-xs">{generateIMBNumber()}</span>
                </p>
              </div>
            </div>
            
            {/* Additional Fields */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah Berkas</label>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  value={formData.jmlBerkas}
                  onChange={(e) => setFormData({ ...formData, jmlBerkas: e.target.value })}
                  placeholder="Jumlah berkas"
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Kondisi Arsip</label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  value={formData.kondisiArsip}
                  onChange={(e) => setFormData({ ...formData, kondisiArsip: e.target.value })}
                >
                  <option value="">Pilih kondisi</option>
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">No Box</label>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  value={formData.noBox}
                  onChange={(e) => setFormData({ ...formData, noBox: e.target.value })}
                  placeholder="No. box"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  File <span className="text-gray-400">(Opsional)</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={formData.file}
                    onChange={(e) => setFormData({ ...formData, file: e.target.value })}
                    placeholder="Nama file"
                  />
                  <button 
                    type="button"
                    className="bg-gray-100 text-gray-600 px-3 rounded-r-md border border-gray-300 hover:bg-gray-200"
                    onClick={() => alert('Upload file functionality')}
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Keterangan <span className="text-gray-400">(Opsional)</span>
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Tambahan keterangan"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading || !selectedSheet}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
  
        {/* Data Table */}
        {sheetData && sheetData.values.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                Data {selectedSheet}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => alert('Export functionality')}
                  className="bg-green-600 text-white py-1.5 px-3 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={sortByIMB}
                  className="bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5"
                  disabled={isLoading}
                >
                  <SortAsc className="w-4 h-4" />
                  Urutkan No. IMB
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {sheetData.values[0].map((header, index) => (
                      <th
                        key={index}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sheetData.values.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {cell}
                        </td>
                      ))}
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => moveRowUp(rowIndex + 1)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            disabled={rowIndex === 0 || isLoading}
                            title="Pindah ke atas"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveRowDown(rowIndex + 1)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            disabled={rowIndex === sheetData.values.length - 2 || isLoading}
                            title="Pindah ke bawah"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert('Edit row ' + (rowIndex + 1))}
                            className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                            disabled={isLoading}
                            title="Edit data"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRow(rowIndex + 1)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            disabled={isLoading}
                            title="Hapus data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Total: {sheetData.values.length - 1} data
              </div>
              <div className="flex gap-1">
                <button
                  className="bg-gray-200 text-gray-600 p-1 rounded hover:bg-gray-300"
                  disabled={true}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="bg-blue-600 text-white px-3 py-1 rounded">1</div>
                <button
                  className="bg-gray-200 text-gray-600 p-1 rounded hover:bg-gray-300"
                  disabled={true}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
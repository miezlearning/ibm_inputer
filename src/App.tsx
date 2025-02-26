import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Trash2, Save, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => console.log('GIS script loaded successfully');
    script.onerror = () => toast.error('Gagal memuat GIS');
    document.body.appendChild(script);

    return () => document.body.removeChild(script);
  }, []);

  const loadSheetsAPI = () => {
    console.log('Loading Sheets API script...');
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.onload = () => {
      console.log('Sheets API script loaded');
      initializeSheetsAPI();
    };
    script.onerror = () => toast.error('Gagal memuat Sheets API');
    document.body.appendChild(script);
  };

  const initializeSheetsAPI = () => {
    if (!window.gapi || !token) {
      console.error('GAPI or token not available:', { gapi: !!window.gapi, token });
      toast.error('GAPI atau token tidak tersedia');
      return;
    }

    console.log('Initializing Sheets API with token:', token);
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        window.gapi.client.setToken({ access_token: token });
        console.log('Sheets API initialized successfully');
        setIsInitialized(true);
        console.log('isInitialized set to true');
        await loadSheets();
      } catch (error: any) {
        console.error('Error initializing Sheets API:', error);
        toast.error('Gagal menginisialisasi Sheets API');
      }
    });
  };

  const handleGoogleLogin = () => {
    if (!window.google) {
      console.error('Google Identity Services not available');
      toast.error('Google Identity Services tidak tersedia');
      return;
    }

    console.log('Starting Google login...');
    setIsLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (response: any) => {
        console.log('Google login callback received:', response);
        setIsLoading(false);
        if (response.error) {
          console.error('Login failed:', response);
          toast.error('Gagal login: ' + response.error);
          return;
        }
        console.log('Setting token:', response.access_token);
        setToken(response.access_token);
        console.log('Token set, loading Sheets API');
        loadSheetsAPI();
      },
    });

    client.requestAccessToken();
  };

  const loadSheets = async () => {
    try {
      console.log('Loading sheets from spreadsheet...');
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
      toast.error('Gagal memuat daftar sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetData = async (sheetName: string) => {
    try {
      setIsLoading(true);
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
        range: `${sheetName}!A:M`,
      });

      setSheetData({ values: response.result.values || [] });
    } catch (error: any) {
      console.error('Error loading sheet data:', error);
      toast.error('Gagal memuat data sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSheet = e.target.value;
    setSelectedSheet(newSheet);
    if (newSheet) await loadSheetData(newSheet);
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
      // Tidak reset formData agar data tetap ada
      await loadSheetData(selectedSheet);
    } catch (error: any) {
      console.error('Error saving data:', error);
      toast.error('Gagal menyimpan data');
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
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Login dengan Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Form Input Data IMB</h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nomor Berkas/Sampul <span className="text-gray-400">(Opsional)</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.nomorBerkas}
                  onChange={(e) => setFormData({ ...formData, nomorBerkas: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kode Klasifikasi</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.kodeKlasifikasi}
                  onChange={(e) => setFormData({ ...formData, kodeKlasifikasi: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Peruntukan</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.peruntukan}
                  onChange={(e) => setFormData({ ...formData, peruntukan: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Alamat</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor IMB</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Format IMB</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.nomorIMB.jenis}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomorIMB: { ...formData.nomorIMB, jenis: e.target.value as 'format1' | 'format2' },
                      })
                    }
                  >
                    <option value="format1">Format 1 (dengan BN,PB&PF)</option>
                    <option value="format2">Format 2 (standar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Nomor Input</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label className="block text-xs text-gray-500">Bulan (Romawi)</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label className="block text-xs text-gray-500">Tahun</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Preview: <span className="font-mono">{generateIMBNumber()}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kurun Waktu</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.kurunWaktu}
                  onChange={(e) => setFormData({ ...formData, kurunWaktu: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tingkat Perkembangan</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.tingkatPerkembangan}
                  onChange={(e) => setFormData({ ...formData, tingkatPerkembangan: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jumlah Berkas</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.jmlBerkas}
                  onChange={(e) => setFormData({ ...formData, jmlBerkas: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kondisi Arsip</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.kondisiArsip}
                  onChange={(e) => setFormData({ ...formData, kondisiArsip: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">No Box</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.noBox}
                  onChange={(e) => setFormData({ ...formData, noBox: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  File <span className="text-gray-400">(Opsional)</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.file}
                  onChange={(e) => setFormData({ ...formData, file: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Keterangan <span className="text-gray-400">(Opsional)</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !selectedSheet}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

        {sheetData && sheetData.values.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Data {selectedSheet}</h2>
              <button
                onClick={sortByIMB}
                className="bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700"
                disabled={isLoading}
              >
                Urutkan Nomor IMB
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {sheetData.values[0].map((header, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sheetData.values.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cell}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => moveRowUp(rowIndex + 1)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={rowIndex === 0 || isLoading}
                          >
                            <ArrowUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => moveRowDown(rowIndex + 1)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={rowIndex === sheetData.values.length - 2 || isLoading}
                          >
                            <ArrowDown className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteRow(rowIndex + 1)}
                            className="text-red-600 hover:text-red-900"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
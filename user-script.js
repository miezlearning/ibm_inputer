// ==UserScript==
// @name         Auto Fill Form Arsip
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Mengisi form arsip secara otomatis
// @author       You
// @match        http://172.16.29.125/earsip/archive/add
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const MONTHS_ROMAN = {
        '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI',
        '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII'
    };

    function generateNoArsip(template, inputan1 = '001', bulan, tahun) {
        const date = new Date();
        const selectedBulan = bulan || (date.getMonth() + 1);
        const selectedTahun = tahun || date.getFullYear();
        return template === 'format1'
            ? `${inputan1}/BPPTSP-KS/IMB/C/BN,PB&PF/${MONTHS_ROMAN[selectedBulan]}/${selectedTahun}`
            : `${inputan1}/BPPTSP-KS/IMB/C/${MONTHS_ROMAN[selectedBulan]}/${selectedTahun}`;
    }

    function formatDate(tanggalInput, bulan, tahun) {
        const date = new Date();
        const selectedBulan = bulan || (date.getMonth() + 1);
        const selectedTahun = tahun || date.getFullYear();
        const hari = tanggalInput ? String(tanggalInput).padStart(2, '0') : '01';
        return `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-${hari}`;
    }

    function getClassificationDescription() {
        const klasifikasi = document.querySelector('select[name="classification_id"]');
        if (klasifikasi && klasifikasi.value) {
            const selectedOption = klasifikasi.options[klasifikasi.selectedIndex].text;
            return (selectedOption.split(' - ')[1] || selectedOption).toUpperCase();
        }
        return '';
    }

    function updateUraian() {
        const uraian = document.querySelector('textarea[name="description"]');
        const namaInput = document.getElementById('namaInput');
        if (uraian) {
            const description = getClassificationDescription();
            const namaValue = namaInput ? (namaInput.value || 'NAMA') : 'NAMA';
            uraian.value = `${namaValue} AN. ${description}`;
        }
    }

    GM_addStyle(`
        .template-selector { position: fixed; top: 10px; right: 10px; background: #fff; border: 1px solid #ccc; padding: 10px; z-index: 9999; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
        .template-selector label { margin-right: 10px; }
        .template-selector button { margin-top: 5px; padding: 5px 10px; background: #007bff; color: white; border: none; cursor: pointer; }
        .template-selector button:hover { background: #0056b3; }
        .template-selector select, .template-selector input[type="text"], .template-selector input[type="number"] { margin-top: 5px; padding: 3px; width: 150px; }
        .template-selector .input-label { display: block; font-weight: bold; margin-top: 5px; }
    `);

    window.addEventListener('load', function() {
        console.log('Page loaded, initializing script...');
        try {
            const ui = document.createElement('div');
            ui.className = 'template-selector';
            ui.innerHTML = `
                <div>
                    <label><input type="radio" name="template" value="format1" checked> Format 1 (BN,PB&PF)</label>
                    <label><input type="radio" name="template" value="format2"> Format 2 (Simple)</label>
                </div>
                <div><span class="input-label">Nomor Awal</span><input type="text" id="inputan1" placeholder="Mis: 001" value="001"></div>
                <div><span class="input-label">Bulan</span><select id="bulanSelector">${generateMonthOptions()}</select></div>
                <div><span class="input-label">Nama</span><input type="text" id="namaInput" placeholder="Masukkan nama"></div>
                <div><span class="input-label">Tahun</span><input type="text" id="tahunInput" placeholder="Mis: 2025" value="${new Date().getFullYear()}"></div>
                <div><span class="input-label">Nomor Box</span><input type="number" id="inputanBox" placeholder="Mis: 1" value="1" min="1" step="1"></div>
                <div><span class="input-label">Tanggal</span><input type="number" id="tanggalInput" placeholder="Mis: 15" value="01" min="1" max="31" step="1"></div>
                <div><span class="input-label">Alamat</span><input type="text" id="alamatInput" placeholder="Masukkan alamat" value="Nama Jalan..."></div>
                <div><button id="applyTemplate">Terapkan</button></div>
            `;
            if (document.body) {
                document.body.appendChild(ui);
                console.log('UI appended successfully');
            } else {
                console.error('document.body not found');
                return;
            }

            document.getElementById('applyTemplate').addEventListener('click', applyTemplate);
            const klasifikasi = document.querySelector('select[name="classification_id"]');
            if (klasifikasi) klasifikasi.addEventListener('change', updateUraian);

            fillDefaultValues();
        } catch (e) {
            console.error('Error in script initialization:', e);
        }
    });

    function generateMonthOptions() {
        return '<option value="">Pilih Bulan</option>' +
               Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][i]}</option>`).join('');
    }

    function applyTemplate() {
        try {
            const template = document.querySelector('input[name="template"]:checked').value;
            const inputan1 = document.getElementById('inputan1').value || '001';
            const bulan = document.getElementById('bulanSelector').value;
            const tahun = document.getElementById('tahunInput').value;
            const tanggal = document.getElementById('tanggalInput').value;
            const box = document.getElementById('inputanBox').value || '1';
            const alamat = document.getElementById('alamatInput').value || 'Nama Jalan...';

            const noArsip = document.querySelector('input[name="no"]');
            if (noArsip) noArsip.value = generateNoArsip(template, inputan1, bulan, tahun);

            const dateField = document.querySelector('input[name="date"]');
            if (dateField) {
                dateField.value = formatDate(tanggal, bulan, tahun);
                // Hapus datepicker jika tidak tersedia
            }

            const location = document.querySelector('input[name="location"]');
            if (location) location.value = `BOX ${box}`;

            const note = document.querySelector('textarea[name="note"]');
            if (note) note.value = alamat;

            fillDefaultValues();
            updateUraian();
        } catch (e) {
            console.error('Error in applyTemplate:', e);
        }
    }

    function fillDefaultValues() {
        try {
            const fields = {
                'classification_id': '13',
                'creator_id': '2',
                'institute_id': '2',
                'media_id': '2',
                'originality': 'Asli',
                'shape': 'Baik'
            };
            for (const [name, value] of Object.entries(fields)) {
                const element = document.querySelector(`select[name="${name}"]`);
                if (element) element.value = value;
            }
        } catch (e) {
            console.error('Error in fillDefaultValues:', e);
        }
    }
})();
// ==UserScript==
// @name         Auto Fill Form Arsip with Template Selector
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Mengisi form arsip secara otomatis dan pastikan redirect ke halaman add setelah submit
// @author       You
// @match        http://172.16.29.106/earsip/archive/add
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

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

    function generateNoArsip(template, inputan1 = '001', bulan, tahun) {
        const date = new Date();
        const selectedBulan = bulan || (date.getMonth() + 1);
        const selectedTahun = tahun || date.getFullYear();

        return template === 'format1'
            ? `${inputan1}/BPPTSP-KS/IMB/C/BN,PB&PF/${MONTHS_ROMAN[selectedBulan]}/${selectedTahun}`
            : `${inputan1}/BPPTSP-KS/IMB/C/${MONTHS_ROMAN[selectedBulan]}/${selectedTahun}`;
    }

    function formatDate(bulan, tahun) {
        const date = new Date();
        const selectedBulan = bulan || (date.getMonth() + 1);
        const selectedTahun = tahun || date.getFullYear();
        const hari = '01';
        return `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-${hari}`;
    }

    function getClassificationDescription() {
        const klasifikasi = document.querySelector('select[name="classification_id"]');
        if (klasifikasi && klasifikasi.value) {
            const selectedOption = klasifikasi.options[klasifikasi.selectedIndex].text;
            const description = selectedOption.split(' - ')[1] || selectedOption;
            return description.toUpperCase();
        }
        return '';
    }

    function updateUraian() {
        const uraian = document.querySelector('textarea[name="description"]');
        if (uraian) {
            const description = getClassificationDescription();
            uraian.value = `NAMA AN. ${description}`;
        }
    }

    GM_addStyle(`
        .template-selector {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #fff;
            border: 1px solid #ccc;
            padding: 10px;
            z-index: 9999;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
        }
        .template-selector label {
            margin-right: 10px;
        }
        .template-selector button {
            margin-top: 5px;
            padding: 5px 10px;
            background: #007bff;
            color: white;
            border: none;
            cursor: pointer;
        }
        .template-selector button:hover {
            background: #0056b3;
        }
        .template-selector select, .template-selector input[type="text"] {
            margin-top: 5px;
            padding: 3px;
            width: 150px;
        }
        .template-selector input[type="number"] {
            margin-top: 5px;
            padding: 3px;
            width: 150px;
        }
    `);

    window.addEventListener('load', function() {
        const form = document.querySelector('form[action="http://172.16.29.106/earsip/archive/save"]');
        if (form) {
            const ui = document.createElement('div');
            ui.className = 'template-selector';
            ui.innerHTML = `
                <div>
                    <label><input type="radio" name="template" value="format1" checked> Format 1 (BN,PB&PF)</label>
                    <label><input type="radio" name="template" value="format2"> Format 2 (Simple)</label>
                </div>
                <div>
                    <input type="text" id="inputan1" placeholder="Nomor awal (mis: 001)" value="001">
                </div>
                <div>
                    <select id="bulanSelector">
                        <option value="">Pilih Bulan</option>
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Maret</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Juni</option>
                        <option value="7">Juli</option>
                        <option value="8">Agustus</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                    </select>
                </div>
                <div>
                    <input type="text" id="tahunInput" placeholder="Tahun (mis: 2025)" value="${new Date().getFullYear()}">
                </div>
                <div>
                    <input type="number" id="inputanBox" placeholder="Nomor Box (mis: 1)" value="1" min="1" step="1">
                </div>
                <div>
                    <button id="applyTemplate">Terapkan</button>
                </div>
            `;
            document.body.appendChild(ui);

            // Validasi inputanBox supaya cuma angka
            const inputanBox = document.getElementById('inputanBox');
            inputanBox.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value === '' || parseInt(this.value) < 1) this.value = '1';
            });

            // Event handler untuk "Terapkan" (hanya isi form, ga submit)
            document.getElementById('applyTemplate').addEventListener('click', function() {
                const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
                const inputan1 = document.getElementById('inputan1').value || '001';
                const selectedBulan = document.getElementById('bulanSelector').value;
                const selectedTahun = document.getElementById('tahunInput').value;
                const inputanBoxValue = document.getElementById('inputanBox').value || '1';
                const noArsipField = document.querySelector('input[name="no"]');
                const tanggalField = document.querySelector('input[name="date"]');
                const lokasiField = document.querySelector('input[name="location"]');

                if (noArsipField) {
                    noArsipField.value = generateNoArsip(selectedTemplate, inputan1, selectedBulan, selectedTahun);
                }

                if (tanggalField) {
                    const formattedDate = formatDate(selectedBulan, selectedTahun);
                    tanggalField.value = formattedDate;
                    if (typeof jQuery !== 'undefined' && jQuery.fn.datepicker) {
                        jQuery(tanggalField).datepicker('setDate', formattedDate).trigger('change');
                    }
                }

                if (lokasiField) {
                    lokasiField.value = `BOX ${inputanBoxValue}`;
                }

                fillOtherFields(selectedBulan, selectedTahun);
                updateUraian();
            });

            // Override form submission untuk redirect ke /earsip/archive/add
            form.addEventListener('submit', function(e) {
                e.preventDefault(); // Cegah submit default
                const formData = new FormData(form);
                fetch(form.action, {
                    method: 'POST',
                    body: formData
                }).then(response => {
                    if (response.ok) {
                        // Redirect manual ke /earsip/archive/add
                        window.location.href = 'http://172.16.29.106/earsip/archive/add';
                    } else {
                        console.error('Gagal submit form');
                        alert('Gagal menyimpan data, cek koneksi atau form.');
                    }
                }).catch(error => {
                    console.error('Error:', error);
                    alert('Error saat submit: ' + error.message);
                });
            });

            const klasifikasi = document.querySelector('select[name="classification_id"]');
            if (klasifikasi) {
                klasifikasi.addEventListener('change', updateUraian);
            }

            const noArsip = document.querySelector('input[name="no"]');
            if (noArsip) {
                noArsip.value = 'Input mas...';
            }
            const tanggal = document.querySelector('input[name="date"]');
            if (tanggal) {
                tanggal.value = formatDate(null, null);
                if (typeof jQuery !== 'undefined' && jQuery.fn.datepicker) {
                    jQuery(tanggal).datepicker('setDate', tanggal.value).trigger('change');
                }
            }
            const lokasi = document.querySelector('input[name="location"]');
            if (lokasi) {
                lokasi.value = 'BOX 1';
            }
            fillOtherFields(null, null);
            updateUraian();
        }
    });

    function fillOtherFields(selectedBulan, selectedTahun) {
        let klasifikasi = document.querySelector('select[name="classification_id"]');
        if (klasifikasi) {
            klasifikasi.value = '13';
        }

        let pembuat = document.querySelector('select[name="creator_id"]');
        if (pembuat) {
            pembuat.value = '2';
        }

        let instansi = document.querySelector('select[name="institute_id"]');
        if (instansi) {
            instansi.value = '2';
        }

        let media = document.querySelector('select[name="media_id"]');
        if (media) {
            media.value = '2';
        }

        let keaslian = document.querySelector('select[name="originality"]');
        if (keaslian) {
            keaslian.value = 'Asli';
        }

        let kondisi = document.querySelector('select[name="shape"]');
        if (kondisi) {
            kondisi.value = 'Baik';
        }

        let keterangan = document.querySelector('textarea[name="note"]');
        if (keterangan) {
            keterangan.value = 'Nama Jalan...';
        }
    }
})();
# Flowra CLI

Flowra CLI adalah utilitas baris-perintah resmi untuk membantu Anda membuat, mengelola, dan menguji proyek berbasis Flowra Framework. Tool ini dikemas untuk dapat dipublikasikan ke npm dengan perintah eksekusi `flowra`.

## Instalasi

```bash
npm install -g flowra-cli
```

Atau gunakan secara lokal sebagai dependensi pengembangan:

```bash
npm install --save-dev flowra-cli
```

## Penggunaan

Setelah terinstal, jalankan `flowra --help` untuk melihat seluruh perintah yang tersedia.

### Membuat Proyek Baru

```bash
flowra create-app my-flowra-app
```

Perintah `create-app` **hanya dapat dijalankan di luar** direktori proyek Flowra yang sudah ada. CLI akan membuat folder `my-flowra-app` dan mengisi struktur proyek siap pakai lengkap dengan skrip pengujian awal.

Setelah scaffolding selesai, jalankan langkah berikut di dalam direktori proyek baru:

```bash
npm install
npm test
npm run dev
```

### Bekerja di Dalam Proyek Flowra

Semua perintah selain `create-app` dan `list` **harus dijalankan di dalam** direktori proyek Flowra yang valid (memiliki dependensi `flowra` di `package.json`). Ini memastikan CLI dapat berinteraksi dengan konfigurasi proyek secara aman.

Contoh:

```bash
flowra serve
flowra module make user
flowra route list
```

## Pengujian

Jalankan seluruh pengujian unit dengan:

```bash
npm test
```

Pengujian akan memastikan bahwa perintah inti CLI bekerja sesuai harapan, termasuk proses pembuatan proyek baru beserta skrip pengujian bawaannya.

## Lisensi

Dirilis di bawah lisensi [MIT](./LICENSE).

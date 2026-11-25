@echo off
rem Eventra: biletimGO etkinliklerini bu bilgisayardan ortak veritabanina yazar.
rem Vercel IPsi biletimGO tarafindan engellendigi icin senkron yerelde calisir.
rem Kayit dosyasi: %USERPROFILE%\eventra-biletimgo-sync.log (proje disinda, GitHuba gitmez)
cd /d "%~dp0.."
echo ===== %date% %time% >> "%USERPROFILE%\eventra-biletimgo-sync.log"
call npx tsx scripts/sync-biletimgo.ts --apply >> "%USERPROFILE%\eventra-biletimgo-sync.log" 2>&1

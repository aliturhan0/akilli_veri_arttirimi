# 🚀 Akıllı Sentetik Veri Artırım Platformu - Kurulum Rehberi

Bu rehber, projenin hem **macOS** hem de **Windows** sistemlerde sorunsuz bir şekilde kurulup çalıştırılmasını sağlamak için hazırlanmıştır. 

> [!WARNING]
> **ÖNEMLİ (Git LFS):** Projede yer alan 700 MB'lık veri seti ve 120 MB'lık yapay zeka modeli (RCGAN) standart GitHub limitlerini aştığı için **Git LFS (Large File Storage)** kullanılarak yüklenmiştir. Projeyi klonlamadan önce mutlaka sisteminizde Git LFS'in kurulu olması gerekmektedir!

---

## 🍎 macOS İçin Kurulum Adımları

### 1. Ön Koşullar ve Git LFS Kurulumu
Eğer sisteminizde Homebrew yüklüyse terminali açıp şu komutları sırasıyla çalıştırın:
```bash
# Git LFS yükle ve etkinleştir
brew install git-lfs
git lfs install
```

### 2. Projeyi Klonlama
Git LFS aktif edildikten sonra projeyi bilgisayarınıza indirin:
```bash
git clone https://github.com/aliturhan0/akilli_veri_arttirimi.git
cd akilli_veri_arttirimi
```

### 3. Sanal Ortam (Virtual Environment) Kurulumu
Sisteminizdeki Python paketleriyle çakışmaması için projenin kendi izole ortamını oluşturun:
```bash
# Sanal ortamı oluştur
python3 -m venv otonom_env

# Sanal ortamı aktif et
source otonom_env/bin/activate
```
*(Terminal satırının başında `(otonom_env)` yazısını görmelisiniz.)*

### 4. Gerekli Kütüphanelerin Yüklenmesi
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Sistemi Başlatma
```bash
python backend/server.py
```
Sunucu başladığında tarayıcınızdan **http://127.0.0.1:8000** adresine giderek platformu kullanabilirsiniz.

---

## 🪟 Windows İçin Kurulum Adımları

### 1. Ön Koşullar ve Git LFS Kurulumu
Windows için Git LFS eklentisini indirip kurmamız gerekiyor:
1. [Git LFS Resmi Sitesine (git-lfs.github.com)](https://git-lfs.github.com/) gidin ve indirip kurun.
2. Kurulum bittikten sonra **Komut İstemcisi (CMD)** veya **PowerShell**'i açın ve şu komutu yazın:
```cmd
git lfs install
```

### 2. Projeyi Klonlama
CMD veya PowerShell üzerinden projenin inmesini istediğiniz klasöre gidip klonlayın:
```cmd
git clone https://github.com/aliturhan0/akilli_veri_arttirimi.git
cd akilli_veri_arttirimi
```

### 3. Sanal Ortam (Virtual Environment) Kurulumu
```cmd
# Sanal ortamı oluştur
python -m venv otonom_env

# Sanal ortamı aktif et
otonom_env\Scripts\activate
```
*(Komut satırının başında `(otonom_env)` yazısını görmelisiniz.)*

### 4. Gerekli Kütüphanelerin Yüklenmesi
```cmd
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Sistemi Başlatma
```cmd
python backend\server.py
```
Sunucu başladığında tarayıcınızdan **http://127.0.0.1:8000** adresine giderek platformu kullanabilirsiniz.

---

## ❓ Olası Hatalar ve Çözümleri

* **Hata:** Projeyi klonladım ama `.csv` veya `.pth` dosyaları 1-2 KB boyutunda görünüyor.
  * **Çözüm:** Bilgisayarınızda Git LFS kurulu değil veya aktif edilmemiş. `git lfs install` yaptıktan sonra proje klasörünün içinde `git lfs pull` komutunu çalıştırarak büyük dosyaların orijinal hallerini çekebilirsiniz.
* **Hata:** `ModuleNotFoundError: No module named 'fastapi'` (veya benzeri)
  * **Çözüm:** Sanal ortamı (otonom_env) aktif etmeyi unutmuş olabilirsiniz. Adım 3'teki aktivasyon komutunu tekrar çalıştırın ve kütüphaneleri kurduğunuzdan emin olun.

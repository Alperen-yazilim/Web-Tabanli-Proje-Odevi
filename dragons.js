// Ejderha sınıfı - oyunun ana düşmanları
class Dragon {
    constructor(type, x, y) {
        // Ejderha türü ve konumu
        this.type = type; // Ejderha tipi (tek_kirmizi, cift_kirmizi, cift_mavi, gold)
        this.x = x; // X koordinatı
        this.y = y; // Y koordinatı
        this.width = 150; // Ekranda gösterilecek genişlik
        this.height = 150; // Ekranda gösterilecek yükseklik
        
        // Görsel ve sağlık
        this.img = new Image(); // Sprite sheet'i
        this.hp = 0; // Sağlık (türüne göre değişir)
        this.speed = 0; // Hareket hızı (türüne göre değişir)
        
        // Sprite sheet bilgileri
        this.spriteWidth = 144; // Her frame'in genişliği
        this.spriteHeight = 128; // Her frame'in yüksekliği
        
        // Animasyon kontrol
        this.frameX = 0; // Mevcut frame X (yatay indeks)
        this.frameY = 3; // Mevcut frame Y (dikey indeks - uçuş animasyonu)
        this.maxFrameX = 3; // Her satırda kaç frame var
        
        // Zaman kontrol
        this.gameFrame = 0; // Toplam oynanmış frame sayısı
        this.staggerFrames = 8; // Her kaç frame'de bir sprite değişir
        
        this.setupDragon(); // Türüne göre ayarları yap
    }

    // Ejderha türüne göre özellikleri ayarla
    setupDragon() {
        // Türe göre sprite, sağlık ve hız belirle
        switch(this.type) {
            case 'tek_kirmizi': // Bir başlı kırmızı ejderha
                this.img.src = 'Ejderha/tek_kirmizi.png'; 
                this.hp = 10; // Az sağlık
                this.speed = 4; // Hızlı
                break;
            case 'cift_kirmizi': // İki başlı kırmızı ejderha
                this.img.src = 'Ejderha/cift_kirmizi.png';
                this.hp = 25; // Orta sağlık
                this.speed = 3; // Orta hız
                break;
            case 'cift_mavi': // İki başlı mavi ejderha
                this.img.src = 'Ejderha/cift_mavi.png';
                this.hp = 40; // Yüksek sağlık
                this.speed = 2.5; // Daha yavaş
                break;
            case 'gold': // Altın ejderha (boss)
                this.img.src = 'Ejderha/gold.png';
                this.width=300;
                this.height=300;
                this.hp = 1000; // Çok yüksek sağlık
                this.speed = 1.5; // Çok yavaş
                break;
        }
        this.maxHp = this.hp;
    }

    // Ejderha fiziği ve AI'ı güncelle
    update(player) {
        // Hedef pozisyonunu ayarla (ilk kez)
        if (!this.targetX) {
            if(this.type==='gold'){
            this.targetX= cvs.width / 2 - this.width / 2;
            this.y=20;
            }else{
            this.targetX = Math.random() * (cvs.width / 2) + (cvs.width / 4); // Canvas'ın ortasında rasgele bir nokta
            this.y = Math.random() * 150 + 50; // Y pozisyonunu rasgele
            }
        }


        // Hedefe doğru git
        if (this.x > this.targetX) {
            // Hedefe doğru sola uç
            this.x -= this.speed;
            this.frameY = 3; // Uçuş animasyonu
        } else {
            // HEDEFE VARDI - Durma pozisyonuna geç
            // Aşağı bakacak şekilde animasyon değiştir
            this.frameY = 2; 

            // Ateş topu çıkarmak için cooldown sistemi
            if (!this.fireCooldown) this.fireCooldown = 0;
            this.fireCooldown++; // Timer artır

            // Cooldown dolduğunda ateş topu çıkar
            if (this.fireCooldown > 120) { 
                // Basit ateş topu (hedef yönü belirtmeden)
                fireballs.push(new Fireball(this.x + (this.width / 2) - 30, this.y + this.height - 40)); 
                this.fireCooldown = 0; // Cooldown sıfırla
            }
        }
        // Hedefe doğru git (TEKRAR)
        if (this.x > this.targetX) {
        this.x -= this.speed;
        this.frameY = 3; // Uçuş animasyonu
    } else {
        // HEDEFE VARDI - Durma pozisyonuna geç
        this.frameY = 2; 

        // Ateş topu çıkarmak için cooldown sistemi
        if (!this.fireCooldown) this.fireCooldown = 0;
        this.fireCooldown++; // Timer artır

        // Cooldown dolduğunda ateş topu çıkar (oyuncuya doğru hedeflenmiş)
        if (this.fireCooldown > 120) { 
            // Oyuncuya doğru ateş topu
            let fireStartX = this.x + (this.width / 2) - 30; 
            let fireStartY = (this.type === 'gold') ? this.y + 120 : this.y + this.height - 40;

            fireballs.push(new Fireball(
                fireStartX, // Çıkış noktası X
                fireStartY, // Çıkış noktası Y
                player.x + (player.width / 2), // Hedef X (oyuncunun merkezi)
                player.y + (player.height / 2),// Hedef Y (oyuncunun merkezi)
                this.type === 'gold'
            )); 
            this.fireCooldown = 0; // Cooldown sıfırla
        }
    }
        // Animasyon güncellemesi
        if (this.gameFrame % this.staggerFrames === 0) {
            if (this.frameX < this.maxFrameX - 1) {
                this.frameX++; // Sonraki frame'e git
            } else {
                this.frameX = 0; // Animasyonu başa dön
            }
        }
        this.gameFrame++; // Frame sayacını artır

        // Çarpışma kutusu - oyuncu ve shurikan çarpışması için
        this.hitbox = {
            x: this.x + 30, // Gövdenin sol kenarı
            y: this.y + 40, // Gövdenin üst kenarı
            width: this.width - 60, // Gövdenin genişliği
            height: this.height - 80 // Gövdenin yüksekliği
        };
    }

    // Ejderhayı canvas'a çiz
    draw(ctx) {
        // Sprite sheet'ten doğru frame'i al ve canvas'a çiz
        ctx.drawImage(
            this.img, // Sprite sheet'i
            this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, // Sprite sheet'te hangi frame
            this.spriteWidth, this.spriteHeight, // Frame'in boyutu
            this.x, this.y, // Canvas'ta nereye çizileceği
            this.width, this.height // Ekranda gösterilecek boyut
        );
        if (this.hp > 0) {
            // Kalan canın yüzdesini hesapla (0.0 ile 1.0 arası bir değer)
            let healthPercent = this.hp / this.maxHp;
            
            // Can barının boyutları ve konumu
            let barWidth = this.width * 0.6; // Ejderhanın genişliğinin %60'ı kadar olsun
            let barHeight = (this.type === 'gold') ? 12 : 6; // Boss ise daha kalın bir bar!
            let barX = this.x + (this.width - barWidth) / 2; // Tam ortala
            let barY = this.y - 15; // Kafasının 15 piksel üstünde dursun

            // 1. Arka plan (Siyah boşluk)
            ctx.fillStyle = 'black';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // 2. Kalan can (Dolu kısım)
            // Boss'un canı mor, diğerlerinin kırmızı olsun
            ctx.fillStyle = (this.type === 'gold') ? '#8e44ad' : 'red'; 
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

            // 3. Çerçeve (Beyaz sınır çizgisi)
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Opsiyonel: Boss'un can barının üstüne ismini yazalım!
            if (this.type === 'gold') {
                ctx.fillStyle = 'gold';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("ALTIN EJDERHA", this.x + this.width / 2, barY - 5);
            }
        }
        // Debug: Çarpışma kutusunu göster (turuncu)
        /*ctx.strokeStyle = "orange";
        ctx.strokeRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);*/
    }
}

// Ateş topu sınıfı - ejderhalar tarafından fırlatılan silah
class Fireball {
    constructor(x, y, targetX, targetY, isBoss=false) { 
        // Başlangıç konumu
        this.x = x; // X koordinatı (ejderhanın ağzından)
        this.y = y; // Y koordinatı (ejderhanın ağzından)
        
        this.isBoss=isBoss;
        this.width= isBoss ? 120 : 60; // Genişlik
        this.height= isBoss ? 120: 60; // Yükseklik
        this.speed= isBoss ? 7 : 5; // Uçuş hızı
        this.damage= isBoss ? 20 : 10 ; // Hasar

        // Görsel yükle
        this.img = new Image();
        this.img.src = 'fireball.png'; 

        // Sprite sheet bilgileri (8 yönde animasyon)
        this.spriteWidth = 64; // Her frame'in genişliği
        this.spriteHeight = 64; // Her frame'in yüksekliği
        this.maxFrameX = 8; // 8 frame'lik animasyon
        this.frameX = 0; // Mevcut animasyon frame'i
        
        // Hedef yönü hesapla (trigonometri)
        let dx = targetX - this.x; // X farkı
        let dy = targetY - this.y; // Y farkı
        
        // Açı hesapla (radyan cinsinden)
        let angle = Math.atan2(dy, dx); 
        
        // Hız vektörü hesapla
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;

        // Açıya göre doğru animasyon frame'ini seç (8 yön)
        let degrees = angle * (180 / Math.PI); // Radyan'dan dereceye çevir
        degrees += 180; // Uygun referans noktasına ayarla
        if (degrees < 0) degrees += 360; // Negatif açıları pozitife çevir
        
        // 45 derece aralıklı 8 yön için frame seç
        this.frameY = Math.round(degrees / 45) % 8; 

        // Animasyon kontrol
        this.gameFrame = 0; // Toplam oynanmış frame sayısı
        this.staggerFrames = 4; // Her kaç frame'de bir sprite değişir
        this.markedForDeletion = false; // Silinmek için işaret
    }

    // Ateş topunu her frame güncelle
    update() {
        // Hızını konuma ekle (doğrusal hareket)
        this.x += this.velocityX; // X hareketi
        this.y += this.velocityY; // Y hareketi

        // Animasyon güncellemesi
        if (this.gameFrame % this.staggerFrames === 0) {
            if (this.frameX < this.maxFrameX - 1) {
                this.frameX++; // Sonraki frame'e git
            } else {
                this.frameX = 0; // Animasyonu başa dön
            }
        }
        this.gameFrame++; // Frame sayacını artır

        // Eğer ekran dışına çıkarsa sil
        if (this.x < -100 || this.x > cvs.width + 100 || this.y < -100 || this.y > cvs.height + 100) {
            this.markedForDeletion = true;
        }

        // Çarpışma kutusu (ateş topunun merkezi)
        this.hitbox = {
            x: this.x + 10, // Biraz kenardan içeri
            y: this.y + 10, // Biraz kenardan içeri
            width: this.width - 20, // Biraz daha küçük
            height: this.height - 20 // Biraz daha küçük
        };
    }

    // Ateş topunu canvas'a çiz
    draw(ctx) {
        // Eğer görsel yüklenmediyse çizme
        if (!this.img.complete || this.img.naturalWidth === 0) return;

        // Sprite sheet'ten doğru frame'i al ve canvas'a çiz
        ctx.drawImage(
            this.img, // Sprite sheet'i
            this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, // Sprite sheet'te hangi frame
            this.spriteWidth, this.spriteHeight, // Frame'in boyutu
            this.x, this.y, // Canvas'ta nereye çizileceği
            this.width, this.height // Ekranda gösterilecek boyut
        );
    }
}
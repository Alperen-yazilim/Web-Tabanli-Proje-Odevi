
// Oyuncu sınıfı - ana karakter kontrolü ve animasyonu
class Player {
    constructor() {
        // Oyuncunun tüm sprite animasyonları (IDLE, RUN, ATTACK, vb)
        this.sprites = {
            IDLE: { img: new Image(), frames: 10 }, // Durma animasyonu (10 frame)
            RUN: { img: new Image(), frames: 16 }, // Koşma animasyonu (16 frame)
            ATTACK: { img: new Image(), frames: 7 }, // Kılıç saldırısı (7 frame)
            THROW: { img: new Image(), frames: 4 }, // Shurikan fırlatma (4 frame)
            HURT: { img: new Image(), frames: 3 } // Hasar alma (3 frame)
        };
        
        // Fiziği kontrol eden değişkenler
        this.velocityY = 0; // Dikey hız (yerçekimi için)
        this.maxHp=100; // Maksimum sağlık
        this.hp= this.maxHp; // Mevcut sağlık
        this.gravity = 0.8; // Yerçekimi kuvveti
        this.jumpPower = -15; // Zıplama kuvveti (negatif = yukarı)
        this.onGround = true; // Zeminde mi?
        
        // Sprite dosyaları yükle
        this.sprites.IDLE.img.src = 'Samuray/IDLE.png'; // Durma pozisyonu görseli
        this.sprites.RUN.img.src = 'Samuray/RUN.png'; // Koşma görseli
        this.sprites.ATTACK.img.src = 'Samuray/ATTACK.png'; // Saldırı görseli
        this.sprites.THROW.img.src = 'Samuray/ATTACK.png'; // Fırlatma görseli (saldırı ile aynı)
        this.sprites.HURT.img.src = 'Samuray/HURT.png'; // Hasar alma görseli
        
        // Sprite harita bilgileri
        this.spriteWidth= 96; // Her sprite frame'inin piksel cinsinden genişliği
        this.spriteHeight= 96; // Her sprite frame'inin piksel cinsinden yüksekliği
        
        // Animasyon ve konum bilgileri
        this.state = 'IDLE'; // Mevcut oyuncu state'i (IDLE, RUN, ATTACK, vb)
        this.frameX = 0; // Sprite sheet'te hangi frame'deyiz
        this.gameFrame = 0; // Toplam oynanmış frame sayısı
        this.staggerFrames = 6; // Animasyon hızı (kaç frame'de bir sprite değişir)
        this.facing= 'right'; // Oyuncu hangi yöne bakıyor (right/left)
        
        // Oyuncu boyutu ve konumu
        this.width = 150; // Ekranda gösterilecek genişlik (sprite'ın gerçek boyutundan farklı)
        this.height = 150; // Ekranda gösterilecek yükseklik
        this.x = 100; // X konumu (ekranın solundan mesafe)
        this.y = cvs.height - 280; // Y konumu (ekranın üstünden mesafe)
    }

// Oyuncuyu canvas'a çiz
    draw() {
    // Mevcut oyuncu state'ine göre doğru sprite'ı al
    const currentSprite = this.sprites[this.state];
    
    // Canvas değişikliklerini kayıt et (ileride geri getirmek için)
    ctx.save(); // Canvas'ın normal (düz) halini hafızaya al
    
    // Oyuncu sola bakıyorsa sprite'ı ters çevir
    if (this.facing === 'left') {
        ctx.scale(-1, 1); // Dünyayı aynala
        ctx.drawImage(
            currentSprite.img, // Sprite sheet'i
            this.frameX * this.spriteWidth, 0, // Sprite sheet'te hangi frame
            this.spriteWidth, this.spriteHeight, // Frame'in boyutu
            -this.x - this.width, this.y, // Canvas'ta nereye çizileceği
            this.width, this.height // Ekranda gösterilecek boyut
        );
    } else {
        // Oyuncu sağa bakıyorsa normal çiz
        ctx.drawImage(
            currentSprite.img,
            this.frameX * this.spriteWidth, 0,
            this.spriteWidth, this.spriteHeight,
            this.x, this.y,
            this.width, this.height
        );
    }
    
    // Canvas durumunu geri yükle
    ctx.restore(); 

    // Oyuncu çarpışma kutosunu hesapla (savaş için)
    this.hitbox = {
        x: this.x + 60,     // Sol kenar
        y: this.y + 70,     // Üst kenar
        width: 30,          // Genişlik
        height: 60          // Yükseklik
    };
    
    // Saldırı alanını hesapla - oyuncunun hangi yöne baktığına göre farklı
    if (this.facing === 'right') {
        this.attackHitbox = {
            x: this.hitbox.x + this.hitbox.width, // Oyuncunun sağındaki alan
            y: this.hitbox.y , 
            width: 80, // Saldırı alanının genişliği
            height: 40
        };
    } else {
        this.attackHitbox = {
            x: this.hitbox.x - 80, // Oyuncunun solundaki alan
            y: this.hitbox.y ,
            width: 80,
            height: 40
        };
    }

    // Debug: Çarpışma kutularını göster (kırmızı - hitbox, mavi - attackHitbox)
    /*ctx.strokeStyle = "red";
    ctx.strokeRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
    if (this.state === 'ATTACK') {
        ctx.strokeStyle = "blue";
        ctx.strokeRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
    }*/
}

// player.js - update() fonksiyonunun içi - Oyuncu fiziği ve animasyonunu her frame güncelle
update() {
    // Saldırı state'i daha hızlı animasyon göster
    let currentStagger = (this.state === 'ATTACK' || this.state === 'THROW') ? 2 : 8;
    
    // Zıplama - W tuşu basılıysa ve oyuncu zeminde ise
    if (keys["KeyW"] && this.onGround) {
        // Zıplama sesi çal
        sfxJump.currentTime=0;
        sfxJump.volume=0.3;
        sfxJump.play().catch(error => console.log("Jump sesi hatası:", error));
        this.velocityY = this.jumpPower; // Zıplama kuvvetini uygula
        this.onGround = false; // Artık zeminde değil
    }
    
    // Fizik (Yerçekimi) - oyuncuyu aşağı düşür
    this.velocityY += this.gravity; // Dikey hızı artır
    this.y += this.velocityY; // Y pozisyonunu güncelle

    // --- BURADAN İTİBAREN YENİ KODLAR BAŞLIYOR ---

    // 1. KATI DUVAR (SOLID WALL) MANTIĞI: Önce hayali bir adım at
    let nextX = this.x; // Sonraki X pozisyonunu başlangıç olarak şu anki X'e set et
    
    // D/A tuşu basılıysa hareket et (saldırı yapıyorken hareket etme)
    if (this.state !== 'ATTACK' && this.state !== 'THROW') {
        if (keys["KeyD"]) { // Sağa git
            this.state = 'RUN'; // Koşma animasyonuna geç
            this.facing = 'right'; // Sağa bak
            nextX += 5; // Sağa git (5 piksel)
        } else if (keys["KeyA"]) { // Sola git
            this.state = 'RUN'; // Koşma animasyonuna geç
            this.facing = 'left'; // Sola bak
            nextX -= 5; // Sola git (5 piksel)
        } 
    }

    // Samuray'ın adım atacağı yerdeki hayali Hitbox'ı
    let canMove = true; // Hareket yapabilir mi?
    let nextHitbox = {
        x: nextX + 60, // Oyuncunun çarpışma kutusunun x ofset'i
        y: this.y + 70, // Oyuncunun çarpışma kutusunun y ofset'i
        width: 30,
        height: 60
    };

    // Ekrandaki tüm zarları kontrol et: Önümde duvar (zar) var mı?
    dices.forEach(dice => {
        if (dice.onGround) { // Yaln\u0131zca zeminde olan zarlar engel olur
            // Eğer bir sonraki adımda zarla çarpışıyorsak...
            if (checkCollision(nextHitbox, dice.hitbox)) {
                // ...ve Samuray zarın üstünde değil de yanındaysa (Ayakları zarın tepesinden aşağıdaysa)
                if (nextHitbox.y + nextHitbox.height > dice.hitbox.y + 10) {
                    canMove = false; // Duvara tosladık, yürüme!
                }
            }
        }
    });

    // Eğer önümüz boşsa (duvar yoksa) gerçekten hareket et
    if (canMove) {
        this.x = nextX;
    }

    // 2. PLATFORM MANTIĞI: Zarın üstüne çıkma
    let groundLevel = cvs.height - this.height - 80; // Varsayılan zemin
    this.activeDice = null; // Şu anki zar referansı sıfırla

    // Zarlar üzerinde standing kontrolü - oyuncu zar üzerinde mi?
    dices.forEach(dice => {
        if (dice.onGround) { // Yaln\u0131zca zeminde olan zarlar önemli
            // X ekseninde zarın tam üstünde miyiz? (Hitbox ile kontrol ediyoruz)
            if (this.hitbox.x + this.hitbox.width > dice.hitbox.x && this.hitbox.x < dice.hitbox.x + dice.hitbox.width) {
                // Aşağı düşüyorsak ve ayaklarımız zarın tepesine değiyorsa
                if (this.velocityY >= 0 && (this.hitbox.y + this.hitbox.height) <= dice.hitbox.y + 30) {
                    
                    // Eğer üst üste binmiş zarlar varsa EN ÜSTTEKİNİ zemin olarak kabul et
                    let tempGround = dice.hitbox.y - 130; // Zar üzerinde durma yüksekliği
                    if(tempGround < groundLevel) {
                        groundLevel = tempGround; // Yeni zemin seviyesini ayarla
                        this.activeDice = dice; // Bu zar üzerindeyiz (shurikan fırlatması için)
                    }
                }
            }
        }
    });

    // Zemin seviyesinin altına düşmesini engelle
    if (this.y > groundLevel) {
        this.y = groundLevel; // Zeminine indir
        this.velocityY = 0; // Düşmeyi durdur
        this.onGround = true; // Zeminde olduğunu işaretle
    }

    // Ekran Sınırları - oyuncunun ekran dışına çıkmasını engelle
    if (this.x < -50) { 
        this.x = -50; // Sol sınırı
    }
    if (this.x > cvs.width - 100) {
        this.x = cvs.width - 100; // Sağ sınırı
    }

    // --- BURADAN SONRA ANİMASYON KODLARI (Aynı kalacak) ---
    // Sprite animasyonunu güncelle
    const currentSprite = this.sprites[this.state];
    if (this.gameFrame % currentStagger === 0) { // Her n frame'de bir frame değiştir
        if (this.frameX < currentSprite.frames - 1) {
            this.frameX++; // Sonraki animasyon frame'ine git
        } else {
            this.frameX = 0; // Animasyon sonundan başa dön
            // Saldırı, hasar ve fırlatma animasyonları bittikten sonra IDLE'a dön
            if (this.state === 'ATTACK' || this.state === 'HURT' || this.state === 'THROW') {
                this.state = 'IDLE';
            }
        }
    }
    this.gameFrame++; // Frame sayacını artır
}
}

// Shurikan sınıfı - oyuncu tarafından fare yönüne doğru fırlatılan silah
class Shuriken {
    constructor(x, y, targetX, targetY) {
        // Başlangıç konumu
        this.x = x; // X koordinatı (oyuncudan alınır)
        this.y = y; // Y koordinatı (oyuncudan alınır)
        this.width = 15; // Shurikan boyutu genişliği
        this.height = 15; // Shurikan boyutu yüksekliği
        this.speed = 8; // Alev topundan çok daha hızlı olsun!

        // Görsel yükle
        this.img = new Image();
        this.img.src = 'shuriken.png'; // DOSYA YOLUNA DİKKAT ET

        // --- HEDEFİ BULMA (Alev topuyla aynı mantık) ---
        // Hedef yönü hesapla (trigonometri)
        let dx = targetX - this.x; // X farkı
        let dy = targetY - this.y; // Y farkı
        let angle = Math.atan2(dy, dx); // Açı hesapla
        
        // Hız vektörünü hesapla (bu açıda belirli hızla hareket)
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
        // -----------------------------------------------

        // Rotasyon animasyonu
        this.rotation = 0; // Kendi etrafında dönme açısı
        this.markedForDeletion = false; // Silinmek için işaret
    }

    // Shurikan'ı her frame güncelle
    update() {
        // Hızını konuma ekle (doğrusal hareket)
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Her karede biraz daha döndür (Sayıyı artırırsan daha hızlı döner)
        this.rotation += 0.3; 

        // Çarpışma kutusu (hitbox)
        this.hitbox = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };

        // Ekrandan çıkarsa sil (Sistemi yormasın)
        if (this.x < -50 || this.x > cvs.width + 50 || this.y < -50 || this.y > cvs.height + 50) {
            this.markedForDeletion = true;
        }
    }

    // Shurikan'ı canvas'a çiz
    draw(ctx) {
        // Eğer görsel yüklenmediyse çizme
        if (!this.img.complete || this.img.naturalWidth === 0) return;

        // Canvas transformasyonu ile dönüşlü çizim
        ctx.save(); // Canvas'ın o anki düz halini kaydet
        
        // 1. Merkez nokta olarak Shurikan'ın merkezine git
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        // 2. O merkez etrafında Canvas'ı döndür
        ctx.rotate(this.rotation);
        // 3. Resmi çiz (Merkezden kaydırdığımız için -width/2, -height/2 yapıyoruz)
        ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
        
        // Canvas durumunu geri yükle
        ctx.restore();
    }
}

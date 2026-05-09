// Zar sınıfı - oyun alanında düşen zarlar
class Dice {
    constructor(x, y) {
        // Zarın üzerindeki noktaların sprite sheet'te bulunduğu koordinatlar (1-6 noktası)
        this.diceCoords = [
            { x: 3, y: 3 },    // 1 nokta
            { x: 41, y: 3 },   // 2 nokta
            { x: 79, y: 3 },   // 3 nokta
            { x: 3, y: 43 },   // 4 nokta
            { x: 41, y: 43 },  // 5 nokta
            { x: 79, y: 43 }   // 6 nokta
        ];

        // Sprite sheet bilgileri
        this.spriteWidth = 34; // Sprite sheet'te her zar frame'inin genişliği
        this.spriteHeight = 34; // Sprite sheet'te her zar frame'inin yüksekliği
        
        // Konum ve boyut
        this.x = x; // X koordinatı
        this.y = y; // Y koordinatı
        this.width = 100; // Ekranda gösterilecek genişlik
        this.height = 100; // Ekranda gösterilecek yükseklik
        
        // Fiziği
        this.velocityY = 0; // Dikey hız (düşme)
        this.gravity = 0.5; // Yerçekimi
        this.onGround = false; // Zeminde mi?

        // Zar özellikleri
        this.value = Math.floor(Math.random() * 6) + 1; // Rastgele 1-6 arası değer
        this.rollTimer = 0; // Zar değişme timer'ı (hızlı dönüşü simüle etmek için)
        
        // Görsel yükle
        this.img = new Image();
        this.img.src = 'zarlar1.png'; // Tüm zarları içeren sprite sheet

        // Durum değişkenleri
        this.hasCrushed = false; // Oyuncuya ezme zedelemesi vurdu mu?
        this.markedForDeletion = false; // Silinmek için işaret
        this.hitbox = { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    // Zarı her frame güncelle
    update(player, dicesArray) {
        // Çarpışma kutusunu güncelle
        this.hitbox = { x: this.x, y: this.y, width: this.width, height: this.height };
        
        // Eğer zeminde değilse düş
        if (!this.onGround) {
            // Yerçekimi uygula
            this.velocityY += this.gravity; // Dikey hızı artır
            this.y += this.velocityY; // Y pozisyonunu güncelle
            
            // Hızlı dönüş animasyonunu simüle et - zar değerini hızlı değiştir
            this.rollTimer++; // Timer'ı artır
            if (this.rollTimer > 5) { // Her 5 frame'de bir
                this.value = Math.floor(Math.random() * 6) + 1; // Rastgele yeni değer
                this.rollTimer = 0; // Timer'ı sıfırla
            }

            // Oyuncu ezme zedelemesi kontrol - zar oyuncuya düşüyor mu?
            if (!this.hasCrushed && checkCollision(this, player.hitbox)) {
                // Zar oyuncunun üstünden mi düşüyor (isabet)?
                if (player.hitbox.y + player.hitbox.height > this.y + 20) {
                    // Oyuncuya hasar ver
                    player.hp -= 25; // 25 hasarı
                    if (player.hp < 0) player.hp = 0; 
                    
                    // Hasar sesi ve animasyonu
                    sfxHurt.currentTime=0;
                    sfxHurt.play().catch(error => console.log("Game Over sesi hatası:", error));
                    player.state = 'HURT'; // Hasar state'ine geç
                    player.frameX = 0; // Animasyonu başa dön
                    this.hasCrushed = true; // Bir kez çarptığını işaretle

                    // İçinde sıkışmamak için Samuray'ı zarın sağına veya soluna ittiriyoruz
                    if (player.x < this.x) player.x -= 80; // Zar sağda ise sola it
                    else player.x += 80; // Zar solda ise sağa it
                }
            }
            
            // Zemin seviyesini belirle
            let currentGround = cvs.height - 100; // Varsayılan zemin
            
            // Diğer zarların üzerine düşme kontrol
            dicesArray.forEach(otherDice => {
                // Sadece diğer zarlar ve zaten zeminde olan zarlar önemli
                if (otherDice !== this && otherDice.onGround && this.x === otherDice.x) {
                    // Üst zar bu zarın üzerine düşüyor mu?
                    if (this.y + this.height <= otherDice.y + this.velocityY + 5 && this.y + this.height >= otherDice.y - 15) {
                        currentGround = otherDice.y; // Yeni zemin seviyesi
                    }
                }
            });
            
            // Zeminine ulaştı mı?
            if (this.y + this.height > currentGround) {
                this.y = currentGround - this.height; // Zeminine indir
                this.velocityY = 0; // Düşmeyi durdur
                this.onGround = true; // Zeminde olduğunu işaretle
            }
        }
    }

    // Zarı canvas'a çiz
    draw(ctx) {
        // Eğer görsel yüklenmediyse çizme
        if (!this.img.complete || this.img.naturalWidth === 0) return;
        // Eğer zar değeri geçerli değilse çizme
        if (this.value < 1) return;
        
        // Mevcut zar değerine göre sprite sheet'te doğru koordinatları al
        let currentCoords = this.diceCoords[this.value - 1]; // 0-5 indeks (1-6 değerlerinden)

        // Sprite sheet'ten doğru zar görseli al ve canvas'a çiz
        ctx.drawImage(
            this.img, // Sprite sheet'i (tüm zarlar)
            currentCoords.x, currentCoords.y, // Sprite sheet'te hangi zar
            this.spriteWidth, this.spriteHeight, // Sprite sheet'te frame boyutu
            this.x, this.y, // Canvas'ta nereye çizileceği
            this.width, this.height // Ekranda gösterilecek boyut
        );
    }
}
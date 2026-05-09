Yorum satırlarını ve boşluk düzeltmelerini ai a yaptırdım (Copilot)
Can barı kodlarını aidan aldım (Gemini)
Gameover kodlarını aidan aldım (Gemini)
HealthOrb classının tamamını aidan aldım (Gemini) 
Arkaplan fikri ve kodlar bana ait ama algoritmasını ai a yaptırdım (ChatGpt)
Animasyonları nasıl yapacağımı aidan öğrendim (ChatGpt)
alev topunun gelişini hesaplayan matematiksel formülleri ve kodları aidan aldım (Gemini)
zar görselleri boşluklar yüzünden kayıyordu.Bu sorunu çözerken aidan yardım aldım. (ChatGpt)
debugging konusunda aidan yardım aldım (Gemini,ChatGpt)






Not: Proje geliştirme sürecinde yapay zeka ile yapılan orijinal yazışmaların bir kısmı kaybolmuştur. Proje kurallarına uymak adına, kaybolan bu promptlar projenin mevcut kodları baz alınarak yapay zeka ile aslına sadık kalınarak yeniden simüle edilmiş ve bu dosyaya aktarılmıştır.



### 1. Animasyon Mantığının Öğrenilmesi
**Soru (Prompt):** JavaScript ve Canvas kullanarak sprite animasyonlarını (koşma, bekleme) nasıl yapabilirim? Mantığı nedir, kısaca açıklar mısın?
**AI Cevabı:** Sprite animasyonlarının temel mantığı, karakterin farklı hareket karelerini içeren tek bir resmi (Sprite Sheet) bir ızgara (grid) gibi düşünmektir. `drawImage` fonksiyonunun 9 parametreli halini kullanarak resmin sadece belirli bir karesini kesip ekrana çizeriz. `frameX` ve `frameY` değişkenleri tutarak ve oyun saniyede 60 kare (fps) güncellenirken `staggerFrames` (yavaşlatma) mantığıyla her X karede bir `frameX` değerini artırarak karakterin hareket ettiğini simüle edersin.

### 2. Arkaplan (Kale Duvarı) Algoritmasının Oluşturulması
**Soru (Prompt):** Arka plana bir kale duvarı çizmek istiyorum. Fikir ve tasarım bana ait: Tuğlalar şaşırtmalı dizilecek (bir alt satırdaki tuğla üsttekinin ortasına denk gelecek). Bunun algoritmasını döngülerle nasıl yazarım?
**AI Cevabı:** Şaşırtmalı tuğla deseni için iç içe iki döngü (satır ve sütun) kullanmalısın. Çift veya tek satırlarda tuğlanın X pozisyonunu genişliğinin yarısı kadar kaydırarak (offset) bu efekti verebilirsin. Örnek kod:
`let xOffset = (r % 2 === 0) ? 0 : -stoneWidth / 2;`
`let x = c * stoneWidth + xOffset;`

### 3. Hedef Güdümlü Alev Topu (Matematiksel Hesaplama)
**Soru (Prompt):** Ejderhanın fırlattığı alev topunun, ateşlendiği an oyuncunun bulunduğu hedefe (X ve Y koordinatlarına) doğru gitmesini istiyorum. Hız vektörlerini nasıl hesaplarım?
**AI Cevabı:** Bunun için Trigonometri (Pisagor ve Arctangent) kullanmalıyız. Önce hedef ile ateş topu arasındaki X ve Y farkını bulup açıyı hesaplarsın. Sonra bu açıyı `Math.cos` ve `Math.sin` ile çarparak X ve Y eksenindeki hızları bulursun:
`let dx = targetX - this.x;`
`let dy = targetY - this.y;`
`let angle = Math.atan2(dy, dx);`
`this.velocityX = Math.cos(angle) * this.speed;`
`this.velocityY = Math.sin(angle) * this.speed;`

### 4. Can Küresi (HealthOrb) Sınıfının Yazılması
**Soru (Prompt):** Düşman ölünce havadan yere düşen, yanıp sönen bir can küresi (HealthOrb) class'ına ihtiyacım var. Yerçekimi etki etsin, zarların üstünde durabilsin ve oyuncu değince canını artırıp yok olsun. Kodlarını oluşturur musun?
**AI Cevabı:** 
class HealthOrb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseRadius = 12;
        this.radius = this.baseRadius;
        this.pulseAngle = 0;
        this.velocityY = 0;
        this.gravity = 0.5;
        this.healAmount = 25;
        this.markedForDeletion = false;
    }

    update(player) {
        this.pulseAngle += 0.1;
        this.radius = this.baseRadius + Math.sin(this.pulseAngle) * 4; 

        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        let groundLevel = cvs.height - 100 - this.baseRadius; 
        
        dices.forEach(dice => {
            if (dice.onGround) { 
                if (this.x > dice.hitbox.x && this.x < dice.hitbox.x + dice.hitbox.width) {
                    let diceTop = dice.hitbox.y - this.baseRadius;
                    
                    if (this.velocityY >= 0 && diceTop < groundLevel) {
                        groundLevel = diceTop; 
                    }
                }
            }
        });
        
        if (this.y > groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0; 
        }

        let dx = (player.hitbox.x + player.hitbox.width / 2) - this.x;
        let dy = (player.hitbox.y + player.hitbox.height / 2) - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + (player.hitbox.width / 2)) {
            sfxHeal.currentTime=0;
            sfxHeal.play().catch(error => console.log("Ses oynatılamadı",error));
            player.hp += this.healAmount; 
            if (player.hp > player.maxHp) player.hp = player.maxHp; 
            this.markedForDeletion = true; 
        }
    }

    draw(ctx) {
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(50, 255, 50, 0.8)';
        ctx.shadowColor = 'lime';
        ctx.shadowBlur = 15; 
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();

        ctx.restore(); 
    }
}
### 5. Can Barı (Health Bar) Çizimleri
**Soru (Prompt):** Oyuncu ve boss ejderha için canvas üzerine bir can barı çizmek istiyorum. Can azaldıkça barın boyu dinamik olarak kısalsın.
**AI Cevabı:** 
function drawHealthBar(ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(20, 20, 200, 20);
    
    ctx.fillStyle = 'red';
    ctx.fillRect(20, 20, player.hp * 2, 20);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 200, 20);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText("HP: " + player.hp, 25, 36);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.fillText("SKOR: " + score, cvs.width - 150, 40);
}

if (this.hp > 0) {
    let healthPercent = this.hp / this.maxHp;
    let barWidth = this.width * 0.6; 
    let barHeight = (this.type === 'gold') ? 12 : 6; 
    let barX = this.x + (this.width - barWidth) / 2; 
    let barY = this.y - 15; 

    ctx.fillStyle = 'black';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = (this.type === 'gold') ? '#8e44ad' : 'red'; 
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    if (this.type === 'gold') {
        ctx.fillStyle = 'gold';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("ALTIN EJDERHA", this.x + this.width / 2, barY - 5);
    }
}
### 6. Sprite Kesim Kaymalarının Çözümü
**Soru (Prompt):** Zar görsellerini sprite sheet'ten çizerken matematiksel bölme kullanıyorum ama resmin etrafındaki şeffaf boşluklar eşit olmadığı için zarlar ekranda titriyor ve kayıyor. Nasıl çözerim?
**AI Cevabı:** Eğer görselin ızgarası (grid) kusursuz değilse matematiksel bölme (`% 3` vb.) kaymalara yol açar. Bunu çözmek için "Manuel Kesim Koordinatları" (Atlas Yöntemi) kullanmalısın. Zarların resimdeki gerçek başlangıç piksellerini bir dizi içinde tutup, değere göre o pikselden kesim yapmalısın:
`this.diceCoords = [ {x: 3, y: 3}, {x: 41, y: 3} ... ];`

### 7. Game Over (Oyun Sonu) Ekranı
**Soru (Prompt):** Oyuncunun canı 0 olduğunda `gameOver = true` olsun, oyun döngüsü tamamen dursun, arka plan siyah yarı saydam olsun ve ekranda kırmızı "GAME OVER" ile skor yazsın.
**AI Cevabı:** 
if (player.hp <= 0) {
    gameOver = true;
    Music.pause();
    sfxGameover.currentTime=0;
    sfxGameover.play().catch(error => console.log("Oyun sonu sesi hatası:", error));
}

if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; 
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    ctx.fillStyle = 'red';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center'; 
    ctx.fillText("GAME OVER", cvs.width / 2, cvs.height / 2 - 20);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Arial';
    ctx.fillText("FINAL SKORUN: " + score, cvs.width / 2, cvs.height / 2 + 40);
    
    ctx.fillStyle = 'lightgray';
    ctx.font = '20px Arial';
    ctx.fillText("Tekrar oynamak icin sayfayi yenile (F5)", cvs.width / 2, cvs.height / 2 + 90);
    
    return; 
}










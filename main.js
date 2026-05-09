// Canvas ve 2D rendering context'i al - oyun çizimi burada yapılır
var cvs= document.getElementById("canvas");
var ctx= cvs.getContext("2d");

// Oyunda kullanılacak ses efektleri tanımla
const sfxSword= new Audio('sounds/sword.mp3'); // Kılıç vuruş sesi
const sfxHurt= new Audio('sounds/Hurt.wav'); // Hasar alma sesi
const sfxJump= new Audio('sounds/jump.wav'); // Zıplama sesi
const Music= new Audio('sounds/music.mp3'); // Arka plan müziği
const sfxHeal= new Audio('sounds/heal.wav'); // İyileşme sesi
const sfxGameover= new Audio('sounds/gameover.mp3'); // Oyun sonu sesi
Music.volume=0.3; // Müzik sesini %30 seviyesine ayarla


// Ana oyun nesneleri ve dizileri tanımla
const player= new Player(); // Oyuncuyu oluştur
const keys = {}; // Basılan tuşları takip etmek için
const enemies = []; // Düşmanları (ejderhalar) saklamak için
const fireballs = []; // Ateş toplarını saklamak için
const shurikens = []; // Shurikanları saklamak için
const dices = []; // Zarları saklamak için
const healthOrbs = []; // Sağlık orkları (iyileşme) saklamak için

// Oyun durumu ve kontrol değişkenleri
let isMusicPlaying= false; // Müzik çalıp çalmadığını kontrol et
let diceSpawnTimer = 0; // Zar oluşum zamanını sayacı
let score = 0; // Oyuncu puanı
let spawnTimer = 0; // Düşman doğma zamanı sayacı
let spawnInterval = 240; // Düşmanlar arasında kaç frame olacak
let maxEnemies= 3; // Aynı anda maximum kaç düşman olabilir
let gameOver = false; // Oyun bitti mi diye kontrol etmek için
let bossSpawned=false;
let gameWon=false;

// Müzik bittiğinde loop yap - müziği tekrar baştan başlat
Music.addEventListener('ended', function() {
    this.currentTime = 0; // Müzik pozisyonunu başa al
    this.play(); // Müziği tekrar oynat
}, false);

// Tuş basılı tutulduğunda tetiklenen event
window.addEventListener("keydown", function (e) {
    keys[e.code] = true; // Basılan tuşu kayıt et

    // İlk tuş basılışında müziği başlat
    if (!isMusicPlaying) {
        Music.play().then(() => {
            isMusicPlaying = true;
        }).catch(error => console.log("Müzik hatası:", error));
    }
    
    // SPACE tuşu - Oyuncu saldırı yap
    if (e.code === "Space") {
        if (player.state !== 'ATTACK') {
            player.state = 'ATTACK'; // Saldırı state'ine geç
            player.frameX = 0; // Animasyon baştan başla
            let swordSoundClone = sfxSword.cloneNode(); // Ses birden çok kez oynatılabilsin diye klonla
            swordSoundClone.volume = 0.5;
            swordSoundClone.play().catch(error => console.log("Kılıç sesi hatası:", error));
        }
    }
    // W tuşu - Oyuncu zıpla
    if (e.code === "KeyW") keys["KeyW"] = true;

});

// Tuş bırakıldığında tetiklenen event
window.addEventListener("keyup", function (e) {
    keys[e.code] = false; // Tuş bırakıldığını kayıt et

    // Sağ/Sol hareket tuşları bırakıldığında - oyuncu durma pozisyonuna geç
    if ((e.code === "KeyD" || e.code === "KeyA") && player.state !== 'ATTACK') {
        player.state = 'IDLE'; // Durma state'ine geç
        player.frameX = 0; // Animasyon baştan başla
    }
    // W tuşu bırakıldı
    if (e.code === "KeyW") keys["KeyW"] = false;
});

// Mouse tıklandığında - Shurikan fırlatma
canvas.addEventListener('mousedown', function(e) {
    if (player.state !== 'THROW') { // Eğer zaten fırlatma animasyonu yapılıyorsa yap
        
        // Oyuncu üzerindeki bir zarın üzerindeyse shurikan fırlatabilir
        if (player.activeDice && player.activeDice.value > 0) {
            
            player.activeDice.value--; // Zarın değerini azalt
            
            // Zar tükendiğinde silinmek için işaretле
            if (player.activeDice.value <= 0) {
                player.activeDice.markedForDeletion = true;
            }

            player.state = 'THROW'; // Fırlatma animasyonuna geç
            player.frameX = 0; // Animasyon baştan başla
            
            // Fare konumunu canvas'a göre hesapla
            const rect = cvs.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Yeni shurikan oluştur ve oyuncu pozisyonundan fare konumuna doğru fırla
            shurikens.push(new Shuriken(
                player.x + (player.width / 2), 
                player.y + (player.height / 2), 
                mouseX, 
                mouseY
            ));
        } 
    }
});



// Ana oyun döngüsü - her frame'de çalışır
function gameLoop() {
    // Ekranı temizle - eski çizimi sil
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    
    // Arkaplan çiz
    drawCastleWall(ctx); // Kale duvarı
    drawFloor(ctx); // Zemin
    
    // Oyuncuyu güncelle ve çiz
    player.update(); // Oyuncu konumu, animasyon vb hesapla
    player.draw(); // Oyuncuyu canvas'a çiz
    
    // Zar doğma sistemи
    diceSpawnTimer++; // Her frame sayaç artır
    if (diceSpawnTimer > 250) { // 250 frame'de bir zar oluştur
        // Canvas'ı eşit şeritlere böl
        const laneWidth = 100; // Her şeridin genişliği
        const numLanes = Math.floor(cvs.width / laneWidth); // Toplam şerit sayısı
        
        // Rastgele bir şerit seç
        const randomLane = Math.floor(Math.random() * numLanes); 
        const startX = randomLane * laneWidth; // Seçili şeridin x konumu
        
        // Yeni zar oluştur ve canvas üstünden başlat
        dices.push(new Dice(startX, -150)); 
        diceSpawnTimer = 0; // Sayaç sıfırla
    }


    // Tüm zarları güncelle ve çiz
    dices.forEach((dice, index) => {
        dice.update(player, dices); // Zarın fiziğini ve animasyonunu güncelle
        dice.draw(ctx); // Zarı çiz
        if (dice.markedForDeletion) dices.splice(index, 1); // Silinmiş zarları diziden çıkar
    });

    // Tüm düşmanları güncelle ve çiz
    enemies.forEach((enemy, index) => {
        enemy.update(player); 
        enemy.draw(ctx); 
        
        // Oyuncu saldırı yaparken düşmanla çarpışma kontrolü
        if (player.state === 'ATTACK') {
            if (checkCollision(player.attackHitbox, enemy.hitbox)) {
                
                // --- YENİ: MULTI-HIT ENGELLEME KORUMASI ---
                // Sadece düşmanın "isInvulnerable" (yenilmez) kalkanı YOKSA hasar ver!
                if (!enemy.isInvulnerable) {
                    
                    enemy.hp -= 80; // Sadece 1 kere 100 hasar vur
                    enemy.isInvulnerable = true; // Hemen kalkanı aç ki 2. kez hasar yemesin
                    
                    // Yarım saniye (500 milisaniye) sonra kalkanı tekrar kapat (Tekrar vurabilelim)
                    setTimeout(() => {
                        enemy.isInvulnerable = false;
                    }, 500);
                    
                // ------------------------------------------
                
                    // Düşman ölmüş ise
                    if (enemy.hp <= 0) {
                        enemies.splice(index, 1); 
                        

                        if (enemy.type === 'gold') score += 50; 
                        else if (enemy.type === 'cift_mavi' || enemy.type === 'cift_kirmizi') score += 20; 
                        else score += 10; 
                    }
                }
            }
        }
    });


    // Tüm ateş toplarını güncelle ve çiz
    fireballs.forEach((fireball, index) => {
        fireball.update(); // Ateş topu konumunu ve animasyonunu güncelle
        fireball.draw(ctx); // Ateş topunu çiz
        
        // Oyuncuyla ateş topu çarpışma kontrolü
        if (checkCollision(player.hitbox, fireball.hitbox)) {
            fireball.markedForDeletion = true; // Ateş topunu sil
            
            // Oyuncuya hasar ver
            player.hp -= fireball.damage;
            if (player.hp < 0) player.hp = 0; 
            
            // Hasar alma animasyonunu oynat
            if (player.state !== 'HURT') {
                sfxHurt.currentTime=0; // Sesin başından çalsın
                sfxHurt.play().catch(error => console.log("Hasar sesi hatası:", error));
                player.state = 'HURT'; // Hasar state'ine geç
                player.frameX = 0; // Animasyon baştan başla
            }
        }

        // Silinmiş ateş toplarını diziden çıkar
        if (fireball.markedForDeletion) {
            fireballs.splice(index, 1);
        }
    });
    // Tüm shurikanları güncelle ve çiz
    shurikens.forEach((shuriken, sIndex) => {
        shuriken.update(); // Shurikan konumunu ve rotasyonunu güncelle
        shuriken.draw(ctx); // Shurikanı çiz

        // Shurikan düşmanla çarpışma kontrolü
        enemies.forEach((enemy, eIndex) => {
            if (checkCollision(shuriken.hitbox, enemy.hitbox)) {
                shuriken.markedForDeletion = true; // Shurikanı sil
                enemy.hp -= 15; // Düşmana hasar ver

                // Düşman ölmüş ise
                if (enemy.hp <= 0) {
                    enemies.splice(eIndex, 1); // Düşmanı sil
                    
                    // %30 ihtimalle sağlık orbu bırak
                    if (Math.random() < 0.3) {
                        healthOrbs.push(new HealthOrb(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2));
                    }

                    // Düşman tipine göre puan ver
                    if (enemy.type === 'gold') score += 1000;
                    else if (enemy.type === 'cift_mavi' || enemy.type === 'cift_kirmizi') score += 25;
                    else score += 15;
                }
            }
        });

        // Silinmiş shurikanları diziden çıkar
        if (shuriken.markedForDeletion) {
            shurikens.splice(sIndex, 1);
        }
    });
    // Tüm sağlık orkularını güncelle ve çiz
    healthOrbs.forEach((orb, index) => {
        orb.update(player); // Orbu güncelle (oyuncuya doğru çekilme vb)
        orb.draw(ctx); // Orbu çiz
        if (orb.markedForDeletion) {
            healthOrbs.splice(index, 1); // Alınan orkuları diziden çıkar
        }
    });
    
    // Sağlık bar'ını çiz
    drawHealthBar(ctx);
    
    // Oyuncunun sağlığı 0 veya altına düşerse oyun bitmiş
    if (player.hp <= 0) {
        gameOver = true;
        Music.pause(); // Müziği durdur
        sfxGameover.currentTime=0; // Ses baştan başla
        sfxGameover.play().catch(error => console.log("Oyun sonu sesi hatası:", error));
    }
    
    // Oyun bitmiş ise Game Over ekranını göster
    if (gameOver) {
        // Kara yarı saydam bir kat çiz
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; 
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        // "GAME OVER" yazısı çiz
        ctx.fillStyle = 'red';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center'; 
        ctx.fillText("GAME OVER", cvs.width / 2, cvs.height / 2 - 20);

        // Final puanı göster
        ctx.fillStyle = 'white';
        ctx.font = 'bold 30px Arial';
        ctx.fillText("FINAL SKORUN: " + score, cvs.width / 2, cvs.height / 2 + 40);
        
        // Yenileme talimatı
        ctx.fillStyle = 'lightgray';
        ctx.font = '20px Arial';
        ctx.fillText("Tekrar oynamak icin sayfayi yenile (F5)", cvs.width / 2, cvs.height / 2 + 90);
        
        return; // Oyun döngüsünü durdur
    }
    
    // Puanın artmasıyla beraber zorluk derecesi artır
    if(score<2000){
    if (score > 100) { spawnInterval = 200; maxEnemies = 4; } // 100 puanın üzerine çıkınca daha sık düşman çık
    if (score > 500) { spawnInterval = 160; maxEnemies = 5; } // 300 puan: daha sık çık
    if (score > 1000) { spawnInterval = 120; maxEnemies = 6; } // 600 puan: çok daha sık
    if (score > 1500) { spawnInterval = 90; maxEnemies = 8; } // 1000 puan: ekstrem zorluk
    
    // Düşman doğma sistemi
    spawnTimer++; // Her frame sayaç artır
    if (spawnTimer > spawnInterval && enemies.length < maxEnemies) {
        // Rastgele düşman tipi seç
        const dragonTypes = ['tek_kirmizi', 'cift_mavi', 'cift_kirmizi'];
        const randomType = dragonTypes[Math.floor(Math.random() * dragonTypes.length)];
        
        // Canvas'ın sağından rastgele bir pozisyonda doğur
        const startX = cvs.width + Math.random() * 200 + 100;
        const startY = Math.random() * 150 + 50; 
        
        // Yeni düşman oluştur
        enemies.push(new Dragon(randomType, startX, startY));
        
        spawnTimer = 0; // Sayaç sıfırla
    }
    }else if(score>=2000 && !bossSpawned){
        maxEnemies=0;
        enemies.push(new Dragon('gold', cvs.width + 200, 20));
        bossSpawned=true;
        
    }
    if (bossSpawned && enemies.length === 0 && !gameOver) {
        gameWon = true;
    }

    if (gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        
        ctx.fillStyle = 'gold'; // Altın sarısı yazı
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("ZAFER SENIN!", cvs.width / 2, cvs.height / 2);
        
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText("Efsanevi Altin Ejderha'yi yendin! Skor: " + score, cvs.width / 2, cvs.height / 2 + 60);
        return; // Oyunu durdur
    }
    // Sonraki frame için gameLoop'u tekrar çağır
    requestAnimationFrame(gameLoop);
}

// Ekranın sol üst köşeye sağlık barı ve skor çiz
function drawHealthBar(ctx) {
    // Sağlık barı arka planı (siyah)
    ctx.fillStyle = 'black';
    ctx.fillRect(20, 20, 200, 20);
    
    // Sağlık barı (kırmızı, oyuncu HP'sine göre uzunluk)
    ctx.fillStyle = 'red';
    ctx.fillRect(20, 20, player.hp * 2, 20);
    
    // Sağlık barı sınırı (beyaz)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 200, 20);
    ctx.textAlign = 'left';
    // Sağlık bar metin
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText("HP: " + player.hp, 25, 36);
    
    // Skor metin (sağ üst köşede)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.fillText("SKOR: " + score, cvs.width - 150, 40);
}

// Arkaplan olarak kale duvarı çiz - tuğla deseni
function drawCastleWall(ctx) {
    const stoneWidth = 20; // Her taş bloğunun genişliği
    const stoneHeight = 10; // Her taş bloğunun yüksekliği
    const rows = cvs.height / stoneHeight; // Satır sayısı
    const cols = cvs.width / stoneWidth + 1; // Sütun sayısı
    const color1= "#57606f"; // Taş rengi
    const color2= "#2f3542"; // Taş çerçevesi rengi

    // Her taş bloğunu çiz
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Her ikinci satırı ofset et (gerçekçi tuğla deseni)
            let xOffset = (r % 2 === 0) ? 0 : -stoneWidth / 2;
            
            let x = c * stoneWidth + xOffset;
            let y = r * stoneHeight;

            // Taşı dolgu ile çiz
            ctx.fillStyle = color1; 
            ctx.fillRect(x, y, stoneWidth, stoneHeight);

            // Taşın çerçevesini çiz
            ctx.strokeStyle = color2;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, stoneWidth, stoneHeight);
        }
    }
}
function drawFloor(ctx){
    const groundHeight=100;
    const stoneWidth=80;
    const stoneHeight=20;
    const startY=canvas.height-groundHeight;
    ctx.fillStyle = "#585d68";
    ctx.fillRect(0,startY,cvs.width,groundHeight);
    ctx.fillStyle= "rgba(0,0,0,0.2)";
    ctx.fillRect(0,startY,cvs.width,groundHeight);
    for(let y=startY; y<cvs.height;y+=stoneHeight){
        for(let x=0;x<cvs.width;x+=stoneWidth){
            let xOffset=((y-startY)/stoneHeight%2==0) ? 0 : -stoneWidth/2;
            ctx.strokeStyle="#2f3542";
            ctx.lineWidth=1;
            ctx.strokeRect(x+xOffset,y,stoneWidth,stoneHeight);


        }


    }


}
// İki dikdörtgen arasında çarpışma kontrolü (AABB - Axis Aligned Bounding Box)
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width && // rect1 sol kenarı rect2'nin sağ kenarından solda
        rect1.x + rect1.width > rect2.x && // rect1 sağ kenarı rect2'nin sol kenarından sağda
        rect1.y < rect2.y + rect2.height && // rect1 üst kenarı rect2'nin alt kenarından yukarıda
        rect1.y + rect1.height > rect2.y // rect1 alt kenarı rect2'nin üst kenarından aşağıda
    );
}


// Sağlık orbu sınıfı - düşmanları öldürdüğünde bırakılan yeşil ışınlı orbu
class HealthOrb {
    constructor(x, y) {
        this.x = x; // Başlangıç x konumu
        this.y = y; // Başlangıç y konumu
        this.baseRadius = 12; // Orbu temel yarıçapı
        this.radius = this.baseRadius; // Şu anki yarıçapı (atım efektiyle değişir)
        this.pulseAngle = 0; // Atım animasyonu için açı
        
        // Fiziğe ait özellikler
        this.velocityY = 0; // Dikey hız
        this.gravity = 0.5; // Yerçekimi
        this.healAmount = 25; // İyileştirme miktarı (sağlık + 25)
        this.markedForDeletion = false; // Silinmek için işaretleme
    }

    update(player) {
        // Atım efekti - orbu düzenli olarak büyütüp küçült
        this.pulseAngle += 0.1;
        this.radius = this.baseRadius + Math.sin(this.pulseAngle) * 4; 

        // Fiziği uygula - düşme
        this.velocityY += this.gravity; // Yerçekimi etkisi
        this.y += this.velocityY; // Y konumunu güncelle
        
        // Zemin seviyesini belirle (normal zemin)
        let groundLevel = cvs.height - 100 - this.baseRadius; 
        
        // Zarların üzerinde fall etmesi kontrol et
        dices.forEach(dice => {
            if (dice.onGround) { // Yalnızca zeminde olan zarlar önemli
                if (this.x > dice.hitbox.x && this.x < dice.hitbox.x + dice.hitbox.width) {
                    // Orbu bu zarın üzerine fall edebilir
                    let diceTop = dice.hitbox.y - this.baseRadius;
                    
                    if (this.velocityY >= 0 && diceTop < groundLevel) {
                        groundLevel = diceTop; // Yeni zemini ayarla
                    }
                }
            }
        });
        
        // Zemin seviyesine ulaştığında dur
        if (this.y > groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0; // Hızı sıfırla
        }
        

        // Oyuncuya doğru çekme - orbu otomatik olarak oyuncuya yaklaşır
        let dx = (player.hitbox.x + player.hitbox.width / 2) - this.x; // Arası x mesafesi
        let dy = (player.hitbox.y + player.hitbox.height / 2) - this.y; // Arası y mesafesi
        let distance = Math.sqrt(dx * dx + dy * dy); // Toplam mesafe (Pisagor teoremi)

        // Oyuncu orbuya yakın ise al
        if (distance < this.radius + (player.hitbox.width / 2)) {
            // İyileşme sesi çal
            sfxHeal.currentTime=0;
            sfxHeal.play().catch(error => console.log("Ses oynatılamadı",error));
            
            // Oyuncuyu iyileştir
            player.hp += this.healAmount; 
            if (player.hp > player.maxHp) player.hp = player.maxHp; // Max HP'yi geçme
            
            // Orbuyu sil
            this.markedForDeletion = true; 
        }
    }

    draw(ctx) {
        ctx.save(); // Canvas durumunu kayıt et
        
        // Dış çember - yeşil ışınlı orbu
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Daire çiz
        ctx.fillStyle = 'rgba(50, 255, 50, 0.8)'; // Yeşil renk
        ctx.shadowColor = 'lime'; // Glow efekti rengi
        ctx.shadowBlur = 15; 
        ctx.fill();
        ctx.closePath();

        // İç çember - beyaz merkez
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();

        ctx.restore(); 
    }
}

gameLoop();

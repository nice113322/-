// проблема возникает, когда окно полностью загружено
window.onload = function() {
    // Получить холст и контекст
        var canvas = document.getElementById("viewport");
        var context = canvas.getContext("2d");
    
    // Хронометраж и количество кадров в секунду
        var lastframe = 0;
        var fpstime = 0;
        var framecount = 0;
        var fps = 0;
    
        var initialized = false;
    
    // Impressive
        var images = [];
        var tileimage;
    
    // Загрузка того, что выше
        var loadcount = 0;
        var loadtotal = 0;
        var preloaded = false;
    
    // Тоже самое, но чуть-чуть другое
        function loadImages(imagefiles) {
    // Инициализация переменных
            loadcount = 0;
            loadtotal = imagefiles.length;
            preloaded = false;
    
    // Тоже самое, но совсем чут-чуть другое
            var loadedimages = [];
            for (var i=0; i<imagefiles.length; i++) {
    // Создайте объект изображения
                var image = new Image();
    
    // Добавить обработчик событий при загрузке
                image.onload = function () {
                    loadcount++;
                    if (loadcount == loadtotal) {
    // Загрузка завершена
                        preloaded = true;
                    }
                };
    
    // Укажите URL-адрес источника изображения
                image.src = imagefiles[i];
    
    // Сохранить в массив изображений
                loadedimages[i] = image;
            }
    
    // Возвращает массив изображений
            return loadedimages;
        }
    
    // Уровень свойств
        var Level = function (columns, rows, tilewidth, tileheight) {
            this.columns = columns;
            this.rows = rows;
            this.tilewidth = tilewidth;
            this.tileheight = tileheight;
    
    // Инициализировать массив плиток
            this.tiles = [];
            for (var i=0; i<this.columns; i++) {
                this.tiles[i] = [];
                for (var j=0; j<this.rows; j++) {
                    this.tiles[i][j] = 0;
                }
            }
        };
    
    // Создать уровень по умолчанию со стенами
        Level.prototype.generate = function() {
            for (var i=0; i<this.columns; i++) {
                for (var j=0; j<this.rows; j++) {
                    if (i == 0 || i == this.columns-1 ||
                        j == 0 || j == this.rows-1) {
    // добавить стены по краям уровней
                        this.tiles[i][j] = 1;
                    } else {
    // Добавить пустое пространство
                        this.tiles[i][j] = 0;
                    }
                }
            }
        };
    
    
    // змейкаааааааа
        var Snake = function() {
            this.init(0, 0, 1, 10, 1);
        }
    
    // Таблица внизу: Вверх, Вправо, Вниз, Влево
        Snake.prototype.directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    
    // Инициализируйте змейку в указанном месте
        Snake.prototype.init = function(x, y, direction, speed, numsegments) {
            this.x = x;
            this.y = y;
            this.direction = direction; // Вверх, Вправо, Вниз, Влево
            this.speed = speed;         // Скорость перемещения в блоках в секунду
            this.movedelay = 0;
    
    // Удалить сегменты и добавить новые
            this.segments = [];
            this.growsegments = 0;
            for (var i=0; i<numsegments; i++) {
                this.segments.push({x:this.x - i*this.directions[direction][0],
                                    y:this.y - i*this.directions[direction][1]});
            }
        }
    
    // Увеличьте количество сегментов
        Snake.prototype.grow = function() {
            this.growsegments++;
        };
    
    // проверить, разрешено ли нам передвигаться
        Snake.prototype.tryMove = function(dt) {
            this.movedelay += dt;
            var maxmovedelay = 1 / this.speed;
            if (this.movedelay > maxmovedelay) {
                return true;
            }
            return false;
        };
    
    // Получить позицию для следующего хода
        Snake.prototype.nextMove = function() {
            var nextx = this.x + this.directions[this.direction][0];
            var nexty = this.y + this.directions[this.direction][1];
            return {x:nextx, y:nexty};
        }
    
    // Переместите змею в нужном направлении.
        Snake.prototype.move = function() {
    // Получите следующий ход и измените позицию.
            var nextmove = this.nextMove();
            this.x = nextmove.x;
            this.y = nextmove.y;
    
    // Получить позицию последнего сегмента
            var lastseg = this.segments[this.segments.length-1];
            var growx = lastseg.x;
            var growy = lastseg.y;
    
    // Переместить сегменты в положение сегмента позиции
            for (var i=this.segments.length-1; i>=1; i--) {
                this.segments[i].x = this.segments[i-1].x;
                this.segments[i].y = this.segments[i-1].y;
            }
    
    // При необходимости увеличьте сегмент.
            if (this.growsegments > 0) {
                this.segments.push({x:growx, y:growy});
                this.growsegments--;
            }
    
    // Переместить первый сегмент
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;
    
    // Сбросить значение movedelay
            this.movedelay = 0;
        }
    
    // Создавать объекты
        var snake = new Snake();
        var level = new Level(20, 15, 32, 32);
    
    // Переменные
        var score = 0;              // Оценка
        var gameover = true;        // Игра окончена
        var gameovertime = 1;       // Как долго у нас была игра окончена
        var gameoverdelay = 0.5;    // Время ожидания после окончания игры
    
    // Инициализировать игру
        function init() {
    // Загрузить изображение
            images = loadImages(["snake-graphics.png"]);
            tileimage = images[0];
    
    // Добавить события мыши
            canvas.addEventListener("mousedown", onMouseDown);
    
    // Добавить события с ключами
            document.addEventListener("keydown", onKeyDown);
    
    // Новая игра
            newGame();
            gameover = true;
    
    // Войти в основной цикл
            main(0);
        }
    
    // Проверьте, можем ли мы начать новую игру
        function tryNewGame() {
            if (gameovertime > gameoverdelay) {
                newGame();
                gameover = false;
            }
        }
    
        function newGame() {
    // Инициализируйте змею
            snake.init(10, 10, 1, 10, 4);
    
    // Сгенерировать уровень по умолчанию
            level.generate();
    
    // Добавить яблоко
            addApple();
    
    // Инициализировать счет
            score = 0;
    
    // Инициализация переменных
            gameover = false;
        }
    
    // Добавьте яблоко на уровень в пустую позицию.
        function addApple() {
    // Продолжаем цикл, пока не получим подходящее яблоко.
            var valid = false;
            while (!valid) {
    // Получить случайную позицию
                var ax = randRange(0, level.columns-1);
                var ay = randRange(0, level.rows-1);
    
    // Убедитесь, что змея не перекрывает новое яблоко.
                var overlap = false;
                for (var i=0; i<snake.segments.length; i++) {
    // Получить положение текущего сегмента змеи
                    var sx = snake.segments[i].x;
                    var sy = snake.segments[i].y;
    
    // Проверить перекрытие
                    if (ax == sx && ay == sy) {
                        overlap = true;
                        break;
                    }
                }
    
    // Плитка должна быть пустой
                if (!overlap && level.tiles[ax][ay] == 0) {
    // Добавьте яблоко на место плитки
                    level.tiles[ax][ay] = 2;
                    valid = true;
                }
            }
        }
    
    // Основной контур
        function main(tframe) {
    // Запросить кадры анимации
            window.requestAnimationFrame(main);
    
            if (!initialized) {
    // Предварительный загрузчик
    
    // Очистить холст
                context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Нарисуйте полосу прогресса
                var loadpercentage = loadcount/loadtotal;
                context.strokeStyle = "#ff8080";
                context.lineWidth=3;
                context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width-37, 32);
                context.fillStyle = "#ff8080";
                context.fillRect(18.5, 0.5 + canvas.height - 51, loadpercentage*(canvas.width-37), 32);
    
    // Нарисуйте текст прогресса
                var loadtext = "Loaded " + loadcount + "/" + loadtotal + " images";
                context.fillStyle = "#000000";
                context.font = "16px Verdana";
                context.fillText(loadtext, 18, 0.5 + canvas.height - 63);
    
                if (preloaded) {
                    initialized = true;
                }
            } else {
    // Обновите и отрендерите игру
                update(tframe);
                render();
            }
        }
    
    // Обновить состояние игры
        function update(tframe) {
            var dt = (tframe - lastframe) / 1000;
            lastframe = tframe;
    
    // Обновите счетчик кадров в секунду
            updateFps(dt);
    
            if (!gameover) {
                updateGame(dt);
            } else {
                gameovertime += dt;
            }
        }
    
        function updateGame(dt) {
    // Переместите змею.
            if (snake.tryMove(dt)) {
    // Проверьте столкновения змей
    
    // Получить координаты следующего хода
                var nextmove = snake.nextMove();
                var nx = nextmove.x;
                var ny = nextmove.y;
    
                if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
                    if (level.tiles[nx][ny] == 1) {
    // Столкновение со стеной
                        gameover = true;
                    }
    
    // Столкновения с самой змеей
                    for (var i=0; i<snake.segments.length; i++) {
                        var sx = snake.segments[i].x;
                        var sy = snake.segments[i].y;
    
                        if (nx == sx && ny == sy) {
    // Найдена часть змеи
                            gameover = true;
                            break;
                        }
                    }
    
                    if (!gameover) {
    // Змее разрешено двигаться
    
    // Переместите змею.
                        snake.move();
    
    // Проверить столкновение с яблоком
                        if (level.tiles[nx][ny] == 2) {
    // Удалить яблоко.
                            level.tiles[nx][ny] = 0;
    
    // Добавить новое яблоко
                            addApple();
    
    // Вырасти змею
                            snake.grow();
    
    // Добавьте очко к счету
                            score++;
                        }
    
    
                    }
                } else {
    // За пределами границ
                    gameover = true;
                }
    
                if (gameover) {
                    gameovertime = 0;
                }
            }
        }
    
        function updateFps(dt) {
            if (fpstime > 0.25) {
    // Рассчитать fps
                fps = Math.round(framecount / fpstime);
    
    // Сбросить время и количество кадров
                fpstime = 0;
                framecount = 0;
            }
    
    // Увеличить время и количество кадров
            fpstime += dt;
            framecount++;
        }
    
    // Рендер игры
        function render() {
    // Нарисовать фон
            context.fillStyle = "#577ddb";
            context.fillRect(0, 0, canvas.width, canvas.height);
    
            drawLevel();
            drawSnake();
    
    // Игра закончена
            if (gameover) {
                context.fillStyle = "rgba(0, 0, 0, 0.5)";
                context.fillRect(0, 0, canvas.width, canvas.height);
    
                context.fillStyle = "#ffffff";
                context.font = "24px Verdana";
                drawCenterText("Нажмите для старта!", 0, canvas.height/2, canvas.width);
            }
        }
    
    // Нарисуйте плитки уровня
        function drawLevel() {
            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
    // Получить текущую плитку и местоположение
                    var tile = level.tiles[i][j];
                    var tilex = i*level.tilewidth;
                    var tiley = j*level.tileheight;
    
    // Рисуйте плитки в зависимости от их типа
                    if (tile == 0) {
    // Пустое место
                        context.fillStyle = "#f7e697";
                        context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                    } else if (tile == 1) {
    // Стена
                        context.fillStyle = "#bcae76";
                        context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                    } else if (tile == 2) {
    // Яблоко
    
    // Нарисовать фон яблока
                        context.fillStyle = "#f7e697";
                        context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
    
    // Нарисуйте изображение яблока.
                        var tx = 0;
                        var ty = 3;
                        var tilew = 64;
                        var tileh = 64;
                        context.drawImage(tileimage, tx*tilew, ty*tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                    }
                }
            }
        }
    
    // Нарисуй змею
        function drawSnake() {
    // Пройдитесь по каждому сегменту змеи
            for (var i=0; i<snake.segments.length; i++) {
                var segment = snake.segments[i];
                var segx = segment.x;
                var segy = segment.y;
                var tilex = segx*level.tilewidth;
                var tiley = segy*level.tileheight;
    
    // Столбец и строка спрайта, которые будут рассчитаны
                var tx = 0;
                var ty = 0;
    
                if (i == 0) {
    // Голова; Определите правильное изображение
                    var nseg = snake.segments[i+1]; // Next segment
                    if (segy < nseg.y) {
    // Вверх
                        tx = 3; ty = 0;
                    } else if (segx > nseg.x) {
    // Верно
                        tx = 4; ty = 0;
                    } else if (segy > nseg.y) {
    // Вниз
                        tx = 4; ty = 1;
                    } else if (segx < nseg.x) {
    // Левый
                        tx = 3; ty = 1;
                    }
                } else if (i == snake.segments.length-1) {
    // Хвост; Определите правильное изображение
                    var pseg = snake.segments[i-1]; // Prev segment
                    if (pseg.y < segy) {
    // Вверх
                        tx = 3; ty = 2;
                    } else if (pseg.x > segx) {
    // Верно
                        tx = 4; ty = 2;
                    } else if (pseg.y > segy) {
    // Вниз
                        tx = 4; ty = 3;
                    } else if (pseg.x < segx) {
    // Левый
                        tx = 3; ty = 3;
                    }
                } else {
    // Тело; Определите правильное изображение
                    var pseg = snake.segments[i-1]; // Previous segment
                    var nseg = snake.segments[i+1]; // Next segment
                    if (pseg.x < segx && nseg.x > segx || nseg.x < segx && pseg.x > segx) {
    // Горизонтально слева направо
                        tx = 1; ty = 0;
                    } else if (pseg.x < segx && nseg.y > segy || nseg.x < segx && pseg.y > segy) {
    // Угол влево-вниз
                        tx = 2; ty = 0;
                    } else if (pseg.y < segy && nseg.y > segy || nseg.y < segy && pseg.y > segy) {
    // Вертикально вверх-вниз
                        tx = 2; ty = 1;
                    } else if (pseg.y < segy && nseg.x < segx || nseg.y < segy && pseg.x < segx) {
    // Угол сверху-слева
                        tx = 2; ty = 2;
                    } else if (pseg.x > segx && nseg.y < segy || nseg.x > segx && pseg.y < segy) {
    // Угол вправо-вверх
                        tx = 0; ty = 1;
                    } else if (pseg.y > segy && nseg.x > segx || nseg.y > segy && pseg.x > segx) {
    // Угол вниз-вправо
                        tx = 0; ty = 0;
                    }
                }
    
    // Нарисуйте изображение части змеи.
                context.drawImage(tileimage, tx*64, ty*64, 64, 64, tilex, tiley,
                                  level.tilewidth, level.tileheight);
            }
        }
    
    // Нарисуйте текст, расположенный по центру
        function drawCenterText(text, x, y, width) {
            var textdim = context.measureText(text);
            context.fillText(text, x + (width-textdim.width)/2, y);
        }
    
    // Получить случайное целое число от низкого до высокого, включительно
        function randRange(low, high) {
            return Math.floor(low + Math.random()*(high-low+1));
        }
    
    // Обработчики событий мыши
        function onMouseDown(e) {
    // Получить позицию мыши
            var pos = getMousePos(canvas, e);
    
            if (gameover) {
    // Начать новую игру
                tryNewGame();
            } else {
    // Изменить направление змеи
                snake.direction = (snake.direction + 1) % snake.directions.length;
            }
        }
    
    // Обработчик событий клавиатуры
        function onKeyDown(e) {
            if (gameover) {
                tryNewGame();
            } else {
                if (e.keyCode == 37 || e.keyCode == 65) {
    // Влево или А
                    if (snake.direction != 1)  {
                        snake.direction = 3;
                    }
                } else if (e.keyCode == 38 || e.keyCode == 87) {
    // Вверх или W
                    if (snake.direction != 2)  {
                        snake.direction = 0;
                    }
                } else if (e.keyCode == 39 || e.keyCode == 68) {
    // Право или D
                    if (snake.direction != 3)  {
                        snake.direction = 1;
                    }
                } else if (e.keyCode == 40 || e.keyCode == 83) {
    // Вниз или S
                    if (snake.direction != 0)  {
                        snake.direction = 2;
                    }
                }
    
    // Выращивать в демонстрационных целях
                if (e.keyCode == 32) {
                    snake.grow();
                }
            }
        }
    
    // Получить позицию мыши
        function getMousePos(canvas, e) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
                y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
            };
        }
    
    // Вызовите init, чтобы начать игру.
        init();
    };
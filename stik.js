Math.minmax = (value, limit) => {
    return Math.max(Math.min(value, limit), -limit);
};

const distance2D = (p1, p2) => {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

// Угол между двумя точками
const getAngle = (p1, p2) => {
    let angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
    if (p2.x - p1.x < 0) angle += Math.PI;
    return angle;
};

// Максимально возможное расстояние между шариком и настенным колпачком
const closestItCanBe = (cap, ball) => {
    let angle = getAngle(cap, ball);

    const deltaX = Math.cos(angle) * (wallW / 2 + ballSize / 2);
    const deltaY = Math.sin(angle) * (wallW / 2 + ballSize / 2);

    return { x: cap.x + deltaX, y: cap.y + deltaY };
};

// Максимально возможное расстояние между шариком и настенным колпачком
const rollAroundCap = (cap, ball) => {
    // Направление, в котором мяч не может двигаться дальше, потому что стена удерживает его
    let impactAngle = getAngle(ball, cap);

    // Направление, в котором должен двигаться мяч, зависит от его скорости
    let heading = getAngle(
        { x: 0, y: 0 },
        { x: ball.velocityX, y: ball.velocityY }
    );

    let impactHeadingAngle = impactAngle - heading;

    // Скоростное расстояние, если бы не произошло попадания
    const velocityMagnitude = distance2D(
        { x: 0, y: 0 },
        { x: ball.velocityX, y: ball.velocityY }
    );
    // Составляющая скорости, направленная по диагонали к месту удара
    const velocityMagnitudeDiagonalToTheImpact =
        Math.sin(impactHeadingAngle) * velocityMagnitude;

    // На каком расстоянии мяч должен находиться от крышки стенки
    const closestDistance = wallW / 2 + ballSize / 2;

    const rotationAngle = Math.atan(
        velocityMagnitudeDiagonalToTheImpact / closestDistance
    );

    const deltaFromCap = {
        x: Math.cos(impactAngle + Math.PI - rotationAngle) * closestDistance,
        y: Math.sin(impactAngle + Math.PI - rotationAngle) * closestDistance
    };

    const x = ball.x;
    const y = ball.y;
    const velocityX = ball.x - (cap.x + deltaFromCap.x);
    const velocityY = ball.y - (cap.y + deltaFromCap.y);
    const nextX = x + velocityX;
    const nextY = y + velocityY;

    return { x, y, velocityX, velocityY, nextX, nextY };
};

// Уменьшает абсолютное значение числа, но сохраняет его знак, не опускаясь ниже abs 0 (pif paf)
const slow = (number, difference) => {
    if (Math.abs(number) <= difference) return 0;
    if (number > difference) return number - difference;
    return number + difference;
};

const mazeElement = document.getElementById("maze");
const joystickHeadElement = document.getElementById("joystick-head");
const noteElement = document.getElementById("note"); // Элемент примечания для инструкций и текстов о выигранной игре и неудаче в игре

let hardMode = false;
let previousTimestamp;
let gameInProgress;
let mouseStartX;
let mouseStartY;
let accelerationX;
let accelerationY;
let frictionX;
let frictionY;

const pathW = 25; // Ширина пути
const wallW = 10; // Ширина стенки
const ballSize = 10; // Ширина и высота шара
const holeSize = 18;

const debugMode = false;

let balls = [];
let ballElements = [];
let holeElements = [];

resetGame();

// Рисуем шары в первый раз
balls.forEach(({ x, y }) => {
    const ball = document.createElement("div");
    ball.setAttribute("class", "ball");
    ball.style.cssText = `left: ${x}px; top: ${y}px; `;

    mazeElement.appendChild(ball);
    ballElements.push(ball);
});

// Метаданные стены
const walls = [
    // Граница
    { column: 0, row: 0, horizontal: true, length: 10 },
    { column: 0, row: 0, horizontal: false, length: 9 },
    { column: 0, row: 9, horizontal: true, length: 10 },
    { column: 10, row: 0, horizontal: false, length: 9 },

    // Горизонтальные линии, начинающиеся в 1-м столбце
    { column: 0, row: 6, horizontal: true, length: 1 },
    { column: 0, row: 8, horizontal: true, length: 1 },

    // Горизонтальные линии, начинающиеся в 2-м столбце
    { column: 1, row: 1, horizontal: true, length: 2 },
    { column: 1, row: 7, horizontal: true, length: 1 },

    // Горизонтальные линии, начинающиеся в 3-м столбце
    { column: 2, row: 2, horizontal: true, length: 2 },
    { column: 2, row: 4, horizontal: true, length: 1 },
    { column: 2, row: 5, horizontal: true, length: 1 },
    { column: 2, row: 6, horizontal: true, length: 1 },

    // Горизонтальные линии, начинающиеся в 4-м столбце
    { column: 3, row: 3, horizontal: true, length: 1 },
    { column: 3, row: 8, horizontal: true, length: 3 },

    // Горизонтальные линии, начинающиеся в 5-м столбце
    { column: 4, row: 6, horizontal: true, length: 1 },

    // Горизонтальные линии, начинающиеся в 6-м столбце
    { column: 5, row: 2, horizontal: true, length: 2 },
    { column: 5, row: 7, horizontal: true, length: 1 },

    // Горизонтальные линии, начинающиеся в 7-м столбце
    { column: 6, row: 1, horizontal: true, length: 1 },
    { column: 6, row: 6, horizontal: true, length: 2 },

    // Горизонтальные линии, начинающиеся в 8-м столбце
    { column: 7, row: 3, horizontal: true, length: 2 },
    { column: 7, row: 7, horizontal: true, length: 2 },

    // Горизонтальные линии, начинающиеся в 9-м столбце
    { column: 8, row: 1, horizontal: true, length: 1 },
    { column: 8, row: 2, horizontal: true, length: 1 },
    { column: 8, row: 3, horizontal: true, length: 1 },
    { column: 8, row: 4, horizontal: true, length: 2 },
    { column: 8, row: 8, horizontal: true, length: 2 },

    // Вертикальные линии после 1-го столбца
    { column: 1, row: 1, horizontal: false, length: 2 },
    { column: 1, row: 4, horizontal: false, length: 2 },

    // Вертикальные линии после 2-го столбца
    { column: 2, row: 2, horizontal: false, length: 2 },
    { column: 2, row: 5, horizontal: false, length: 1 },
    { column: 2, row: 7, horizontal: false, length: 2 },

    // Вертикальные линии после 3-го столбца
    { column: 3, row: 0, horizontal: false, length: 1 },
    { column: 3, row: 4, horizontal: false, length: 1 },
    { column: 3, row: 6, horizontal: false, length: 2 },

    // Вертикальные линии после 4-го столбца
    { column: 4, row: 1, horizontal: false, length: 2 },
    { column: 4, row: 6, horizontal: false, length: 1 },

    // Вертикальные линии после 5-го столбца
    { column: 5, row: 0, horizontal: false, length: 2 },
    { column: 5, row: 6, horizontal: false, length: 1 },
    { column: 5, row: 8, horizontal: false, length: 1 },

    // Вертикальные линии после 6-го столбца
    { column: 6, row: 4, horizontal: false, length: 1 },
    { column: 6, row: 6, horizontal: false, length: 1 },

    // Вертикальные линии после 7-го столбца
    { column: 7, row: 1, horizontal: false, length: 4 },
    { column: 7, row: 7, horizontal: false, length: 2 },

    // Вертикальные линии после 8-го столбца
    { column: 8, row: 2, horizontal: false, length: 1 },
    { column: 8, row: 4, horizontal: false, length: 2 },

    // Вертикальные линии после 9-го столбца
    { column: 9, row: 1, horizontal: false, length: 1 },
    { column: 9, row: 5, horizontal: false, length: 2 }
].map((wall) => ({
    x: wall.column * (pathW + wallW),
    y: wall.row * (pathW + wallW),
    horizontal: wall.horizontal,
    length: wall.length * (pathW + wallW)
}));

// Рисовать стены
walls.forEach(({ x, y, horizontal, length }) => {
    const wall = document.createElement("div");
    wall.setAttribute("class", "wall");
    wall.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${wallW}px;
        height: ${length}px;
        transform: rotate(${horizontal ? -90 : 0}deg);
      `;

    mazeElement.appendChild(wall);
});

const holes = [
    { column: 0, row: 5 },
    { column: 2, row: 0 },
    { column: 2, row: 4 },
    { column: 4, row: 6 },
    { column: 6, row: 2 },
    { column: 6, row: 8 },
    { column: 8, row: 1 },
    { column: 8, row: 2 }
].map((hole) => ({
    x: hole.column * (wallW + pathW) + (wallW / 2 + pathW / 2),
    y: hole.row * (wallW + pathW) + (wallW / 2 + pathW / 2)
}));

joystickHeadElement.addEventListener("mousedown", function (event) {
    if (!gameInProgress) {
        mouseStartX = event.clientX;
        mouseStartY = event.clientY;
        gameInProgress = true;
        window.requestAnimationFrame(main);
        noteElement.style.opacity = 0;
        joystickHeadElement.style.cssText = `
          animation: none;
          cursor: grabbing;
        `;
    }
});

window.addEventListener("mousemove", function (event) {
    if (gameInProgress) {
        const mouseDeltaX = -Math.minmax(mouseStartX - event.clientX, 15);
        const mouseDeltaY = -Math.minmax(mouseStartY - event.clientY, 15);

        joystickHeadElement.style.cssText = `
          left: ${mouseDeltaX}px;
          top: ${mouseDeltaY}px;
          animation: none;
          cursor: grabbing;
        `;

        const rotationY = mouseDeltaX * 0.8; // Максимальное вращение = 12
        const rotationX = mouseDeltaY * 0.8;

        mazeElement.style.cssText = `
          transform: rotateY(${rotationY}deg) rotateX(${-rotationX}deg)
        `;

        const gravity = 2;
        const friction = 0.01; // Коэффициенты трения

        accelerationX = gravity * Math.sin((rotationY / 180) * Math.PI);
        accelerationY = gravity * Math.sin((rotationX / 180) * Math.PI);
        frictionX = gravity * Math.cos((rotationY / 180) * Math.PI) * friction;
        frictionY = gravity * Math.cos((rotationX / 180) * Math.PI) * friction;
    }
});

window.addEventListener("keydown", function (event) {
    // Массив всех возможных клавиш, с учетом русских и латинских символов (Али, я знаю что это дермище, но мне похер) 
    const validKeys = ["Space", "KeyH", "KeyE", "KeyШ", "Keyе"];

    // Если нажатая клавиша не в списке, выходим
    if (!validKeys.includes(event.code)) return;

    // Если нажата клавиша, предотвращаем действие по умолчанию
    event.preventDefault();

    // Если нажата пробел, перезапускаем игру
    if (event.code == "Space") {
        resetGame();
        return;
    }

    // Устанавливаем сложный режим
    if (event.code == "KeyH" || event.code == "KeyШ") {
        hardMode = true;
        resetGame();
        return;
    }

    // Устанавливаем легкий режим
    if (event.code == "KeyE" || event.code == "Keyе") {
        hardMode = false;
        resetGame();
        return;
    }
});


function resetGame() {
    previousTimestamp = undefined;
    gameInProgress = false;
    mouseStartX = undefined;
    mouseStartY = undefined;
    accelerationX = undefined;
    accelerationY = undefined;
    frictionX = undefined;
    frictionY = undefined;

    mazeElement.style.cssText = `
        transform: rotateY(0deg) rotateX(0deg)
      `;

    joystickHeadElement.style.cssText = `
        left: 0;
        top: 0;
        animation: glow;
        cursor: grab;
      `;

      if (hardMode) {
        noteElement.innerHTML = `Нажмите на джойстик, чтобы начать!
          <p>Сложный режим, избегайте черных дыр. Вернуться к легкому режиму? Нажмите E</p>`;
    } else {
        noteElement.innerHTML = `Нажмите на джойстик, чтобы начать!
          <p>Переместите все шары в центр. Готовы к сложному режиму? Нажмите H</p>`;
    }    
    noteElement.style.opacity = 1;

    balls = [
        { column: 0, row: 0 },
        { column: 9, row: 0 },
        { column: 0, row: 8 },
        { column: 9, row: 8 }
    ].map((ball) => ({
        x: ball.column * (wallW + pathW) + (wallW / 2 + pathW / 2),
        y: ball.row * (wallW + pathW) + (wallW / 2 + pathW / 2),
        velocityX: 0,
        velocityY: 0
    }));

    if (ballElements.length) {
        balls.forEach(({ x, y }, index) => {
            ballElements[index].style.cssText = `left: ${x}px; top: ${y}px; `;
        });
    }

    // Удалить предыдущие элементы с отверстиями
    holeElements.forEach((holeElement) => {
        mazeElement.removeChild(holeElement);
    });
    holeElements = [];

    // Сбросить элементы отверстий в жестком режиме
    if (hardMode) {
        holes.forEach(({ x, y }) => {
            const ball = document.createElement("div");
            ball.setAttribute("class", "black-hole");
            ball.style.cssText = `left: ${x}px; top: ${y}px; `;

            mazeElement.appendChild(ball);
            holeElements.push(ball);
        });
    }
}

function main(timestamp) {
    // Можно перезапустить игру в середине игры. В этом случае просмотр должен прекратиться
    if (!gameInProgress) return;

    if (previousTimestamp === undefined) {
        previousTimestamp = timestamp;
        window.requestAnimationFrame(main);
        return;
    }

    const maxVelocity = 1.5;

    // Эта функция вызывается в среднем каждые 16 мс, поэтому при делении на 16 получится 1
    const timeElapsed = (timestamp - previousTimestamp) / 16;

    try {
        // Если мышь еще не двигалась, ничего не делайте (-_- а как фиксить?)
        if (accelerationX != undefined && accelerationY != undefined) {
            const velocityChangeX = accelerationX * timeElapsed;
            const velocityChangeY = accelerationY * timeElapsed;
            const frictionDeltaX = frictionX * timeElapsed;
            const frictionDeltaY = frictionY * timeElapsed;

            balls.forEach((ball) => {
                if (velocityChangeX == 0) {
                    // Вращения нет, плоскость плоская
                    ball.velocityX = slow(ball.velocityX, frictionDeltaX);
                } else {
                    ball.velocityX = ball.velocityX + velocityChangeX;
                    ball.velocityX = Math.max(Math.min(ball.velocityX, 1.5), -1.5);
                    ball.velocityX =
                        ball.velocityX - Math.sign(velocityChangeX) * frictionDeltaX;
                    ball.velocityX = Math.minmax(ball.velocityX, maxVelocity);
                }

                if (velocityChangeY == 0) {
                    // Вращения нет, плоскость плоская
                    ball.velocityY = slow(ball.velocityY, frictionDeltaY);
                } else {
                    ball.velocityY = ball.velocityY + velocityChangeY;
                    ball.velocityY =
                        ball.velocityY - Math.sign(velocityChangeY) * frictionDeltaY;
                    ball.velocityY = Math.minmax(ball.velocityY, maxVelocity);
                }

                // Предварительное положение следующего мяча, становится истинным только в том случае, если не происходит попадания
                // Используется только для проверки попадания, но не означает, что мяч достигнет этой позиции
                ball.nextX = ball.x + ball.velocityX;
                ball.nextY = ball.y + ball.velocityY;

                if (debugMode) console.log("tick", ball);

                walls.forEach((wall, wi) => {
                    if (wall.horizontal) {
                        // Горизонтальная стена

                        if (
                            ball.nextY + ballSize / 2 >= wall.y - wallW / 2 &&
                            ball.nextY - ballSize / 2 <= wall.y + wallW / 2
                        ) {

                            const wallStart = {
                                x: wall.x,
                                y: wall.y
                            };
                            const wallEnd = {
                                x: wall.x + wall.length,
                                y: wall.y
                            };

                            if (
                                ball.nextX + ballSize / 2 >= wallStart.x - wallW / 2 &&
                                ball.nextX < wallStart.x
                            ) {
                                // Мяч может попасть в левый край горизонтальной стены
                                const distance = distance2D(wallStart, {
                                    x: ball.nextX,
                                    y: ball.nextY
                                });
                                if (distance < ballSize / 2 + wallW / 2) {
                                    if (debugMode && wi > 4)
                                        console.warn("слишком близко к голове", distance, ball);

                                    const closest = closestItCanBe(wallStart, {
                                        x: ball.nextX,
                                        y: ball.nextY
                                    });
                                    const rolled = rollAroundCap(wallStart, {
                                        x: closest.x,
                                        y: closest.y,
                                        velocityX: ball.velocityX,
                                        velocityY: ball.velocityY
                                    });

                                    Object.assign(ball, rolled);
                                }
                            }

                            if (
                                ball.nextX - ballSize / 2 <= wallEnd.x + wallW / 2 &&
                                ball.nextX > wallEnd.x
                            ) {
                                // Мяч может попасть в правый край горизонтальной стены
                                const distance = distance2D(wallEnd, {
                                    x: ball.nextX,
                                    y: ball.nextY
                                });
                                if (distance < ballSize / 2 + wallW / 2) {
                                    if (debugMode && wi > 4)
                                        console.warn("слишком близко к хвосту", distance, ball);

                                    // Мяч попадает в правый край горизонтальной стены
                                    const closest = closestItCanBe(wallEnd, {
                                        x: ball.nextX,
                                        y: ball.nextY
                                    });
                                    const rolled = rollAroundCap(wallEnd, {
                                        x: closest.x,
                                        y: closest.y,
                                        velocityX: ball.velocityX,
                                        velocityY: ball.velocityY
                                    });

                                    Object.assign(ball, rolled);
                                }
                            }

                            if (ball.nextX >= wallStart.x && ball.nextX <= wallEnd.x) {
                                // Мяч попал в основную часть стены
                                if (ball.nextY < wall.y) {
                                    ball.nextY = wall.y - wallW / 2 - ballSize / 2;
                                } else {
                                    ball.nextY = wall.y + wallW / 2 + ballSize / 2;
                                }
                                ball.y = ball.nextY;
                                ball.velocityY = -ball.velocityY / 3;

                                if (debugMode && wi > 4)
                                    console.error("пересекая линию h, ПОПАЛ", ball);
                            }
                        }
                    } else {
                        // Vertical wall

                        if (
                            ball.nextX + ballSize / 2 >= wall.x - wallW / 2 &&
                            ball.nextX - ballSize / 2 <= wall.x + wallW / 2
                        ) {
                            // Мяч попал в полосу стены
                            const wallStart = {
                                x: wall.x,
                                y: wall.y
                            };
                            const wallEnd = {
                                x: wall.x,
                                y: wall.y + wall.length
                            };

                            if (
                                ball.nextY + ballSize / 2 >= wallStart.y - wallW / 2 &&
                                ball.nextY < wallStart.y
                            ) {
                                const distance = distance2D(wallStart, {
                                    x: ball.nextX,
                                    y: ball.nextY
                                });
                                if (distance < ballSize / 2 + wallW / 2) {
                                    if (debugMode && wi > 4)
                                        console.warn("слишком близкая v-образная головка", distance, ball);

                                    const closest = closestItCanBe(wallStart, {
                                        x: ball.nextX,
                                        y: ball.nextY
                                    });
                                    const rolled = rollAroundCap(wallStart, {
                                        x: closest.x,
                                        y: closest.y,
                                        velocityX: ball.velocityX,
                                        velocityY: ball.velocityY
                                    });

                                    Object.assign(ball, rolled);
                                }
                            }

                            if (
                                ball.nextY - ballSize / 2 <= wallEnd.y + wallW / 2 &&
                                ball.nextY > wallEnd.y
                            ) {
                                // Мяч может удариться о нижнюю кромку горизонтальной стены
                                const distance = distance2D(wallEnd, {
                                    x: ball.nextX,
                                    y: ball.nextY
                                });
                                if (distance < ballSize / 2 + wallW / 2) {
                                    if (debugMode && wi > 4)
                                        console.warn("слишком узкий v-образный хвост", distance, ball);

                                    // Мяч попадает в правый край горизонтальной стены
                                    const closest = closestItCanBe(wallEnd, {
                                        x: ball.nextX,
                                        y: ball.nextY
                                    });
                                    const rolled = rollAroundCap(wallEnd, {
                                        x: closest.x,
                                        y: closest.y,
                                        velocityX: ball.velocityX,
                                        velocityY: ball.velocityY
                                    });

                                    Object.assign(ball, rolled);
                                }
                            }

                            if (ball.nextY >= wallStart.y && ball.nextY <= wallEnd.y) {
                                // Мяч попал в основную часть стены
                                if (ball.nextX < wall.x) {
                                    ball.nextX = wall.x - wallW / 2 - ballSize / 2;
                                } else {
                                    ball.nextX = wall.x + wallW / 2 + ballSize / 2;
                                }
                                ball.x = ball.nextX;
                                ball.velocityX = -ball.velocityX / 3;

                                if (debugMode && wi > 4)
                                    console.error("пересекая линию v, ПОПАЛ", ball);
                            }
                        }
                    }
                });

                // Определить, попал ли мяч в лунку
                if (hardMode) {
                    holes.forEach((hole, hi) => {
                        const distance = distance2D(hole, {
                            x: ball.nextX,
                            y: ball.nextY
                        });

                        if (distance <= holeSize / 2) {
                            holeElements[hi].style.backgroundColor = "red";
                            throw Error("Мяч упал в лунку");
                        }
                    });
                }

                ball.x = ball.x + ball.velocityX;
                ball.y = ball.y + ball.velocityY;
            });

            balls.forEach(({ x, y }, index) => {
                ballElements[index].style.cssText = `left: ${x}px; top: ${y}px; `;
            });
        }

        // Обнаружение выигрыша
        if (
            balls.every(
                (ball) => distance2D(ball, { x: 350 / 2, y: 315 / 2 }) < 65 / 2
            )
        ) {
            noteElement.innerHTML = `АЙ МОЛОДЦА!
          ${!hardMode ? "<p>Нажмите H для сложного режима" : ""}`;
            noteElement.style.opacity = 1;
            gameInProgress = false;
        } else {
            previousTimestamp = timestamp;
            window.requestAnimationFrame(main);
        }
    } catch (error) {
        if (error.message == "The ball fell into a hole") {
            noteElement.innerHTML = `Шарик упал в черную дыру! Нажмите пробел, чтобы сбросить игру.
          <p>
            Вернуться к легкому режиму? Нажмите E.
          </p>`;
            noteElement.style.opacity = 1;
            gameInProgress = false;
        } else throw error;
    }
}

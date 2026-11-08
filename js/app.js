"use strict";

/* =====================================================
   НАСТРОЙКИ
===================================================== */

const DAY_MINUTES = 1440;

const DRAFT_STORAGE_KEY =
    "psychologist-calculator-2-draft";

const MINUTE_OPTIONS = [
    0,
    5,
    10,
    15,
    20,
    30,
    45,
    50,
    55
];


const ACTIVITIES = [

    {
        id: "sleep",
        name: "Сон"
    },

    {
        id: "mainWork",
        name: "Основная работа"
    },

    {
        id: "consultations",
        name: "Консультации"
    },

    {
        id: "consultationPreparation",
        name: "Подготовка к консультациям"
    },

    {
        id: "education",
        name: "Обучение"
    },

    {
        id: "road",
        name: "Дорога"
    },

    {
        id: "home",
        name: "Дом и бытовые дела"
    },

    {
        id: "family",
        name: "Семья / дети"
    },

    {
        id: "sport",
        name: "Спорт"
    },

    {
        id: "rest",
        name: "Отдых"
    },

    {
        id: "social",
        name: "Социальные сети для себя"
    },

    {
        id: "promotion",
        name: "Продвижение"
    }
];


const FREE_TIME_CHART_ID =
    "freeTime";

const CHART_COLOR_BY_ID = {
    sleep:
        "#3766C3",
    mainWork:
        "#7442B8",
    consultations:
        "#008F89",
    consultationPreparation:
        "#E67828",
    education:
        "#D34B91",
    road:
        "#65788C",
    home:
        "#B85B3C",
    family:
        "#C8A019",
    sport:
        "#379B45",
    rest:
        "#19A8C8",
    social:
        "#AA5990",
    promotion:
        "#E34D56",
    [FREE_TIME_CHART_ID]:
        "#91A69C"
};

const CUSTOM_ACTIVITY_CHART_COLORS = [
    "#5B7FA6",
    "#6B8E7B",
    "#9B7EB8",
    "#4F8F7A",
    "#B07D62",
    "#7A9E68",
    "#8C6B98",
    "#5C8FA3",
    "#A68B5B",
    "#6E8F8B",
    "#9986A8",
    "#5F9E8F"
];


let customCounter = 0;

let selectedGoalMinutes = null;

let customGoalSelected = false;

let restoringDraft = false;

let draftSaveTimer = null;

let liveResultsActive =
    false;


/* =====================================================
   DOM
===================================================== */

const startScreen =
    document.getElementById(
        "startScreen"
    );

const calculatorScreen =
    document.getElementById(
        "calculatorScreen"
    );

const defaultActivities =
    document.getElementById(
        "defaultActivities"
    );

const customActivities =
    document.getElementById(
        "customActivities"
    );

const dayDate =
    document.getElementById(
        "dayDate"
    );

const goalHours =
    document.getElementById(
        "goalHours"
    );

const goalMinutes =
    document.getElementById(
        "goalMinutes"
    );

const customGoalFields =
    document.getElementById(
        "customGoalFields"
    );

const resultSection =
    document.getElementById(
        "resultSection"
    );

const reviewSection =
    document.getElementById(
        "reviewSection"
    );

const calculateButton =
    document.getElementById(
        "calculateButton"
    );


/* =====================================================
   ДАТЫ
===================================================== */

function getLocalToday() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );
}


function formatDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const [
        year,
        month,
        day
    ] =
        dateString.split(
            "-"
        );


    return (
        `${day}.${month}.${year}`
    );
}


/* =====================================================
   ВРЕМЯ
===================================================== */

function clamp(
    value,
    min,
    max
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return min;
    }


    return Math.min(
        Math.max(
            number,
            min
        ),
        max
    );
}


function formatTime(
    totalMinutes
) {

    const value =
        Math.max(
            0,
            Math.round(
                totalMinutes
            )
        );


    const hours =
        Math.floor(
            value / 60
        );


    const minutes =
        value % 60;


    if (
        hours === 0
    ) {

        return (
            `${minutes} мин`
        );
    }


    if (
        minutes === 0
    ) {

        return (
            `${hours} ч`
        );
    }


    return (
        `${hours} ч ` +
        `${minutes} мин`
    );
}


/* =====================================================
   МИНУТЫ В SELECT
===================================================== */

function makeMinuteOptions(
    select
) {

    select.replaceChildren();


    MINUTE_OPTIONS.forEach(
        value => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                value;


            option.textContent =
                value;


            select.appendChild(
                option
            );
        }
    );
}


/* =====================================================
   ПОЛЯ ЧАСОВ И МИНУТ
===================================================== */

function createHoursField() {

    const field =
        document.createElement(
            "div"
        );


    field.className =
        "field";


    const label =
        document.createElement(
            "label"
        );


    label.textContent =
        "Часы";


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "number";


    input.min =
        "0";


    input.max =
        "24";


    input.step =
        "1";


    input.value =
        "0";


    input.className =
        "hours-input";


    field.append(
        label,
        input
    );


    return field;
}


function createMinutesField() {

    const field =
        document.createElement(
            "div"
        );


    field.className =
        "field";


    const label =
        document.createElement(
            "label"
        );


    label.textContent =
        "Минуты";


    const select =
        document.createElement(
            "select"
        );


    select.className =
        "minutes-input";


    makeMinuteOptions(
        select
    );


    field.append(
        label,
        select
    );


    return field;
}


/* =====================================================
   ГОТОВЫЕ КАТЕГОРИИ
===================================================== */

function createActivityRow(
    activity
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "activity-row";


    row.dataset.id =
        activity.id;


    row.dataset.name =
        activity.name;


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "activity-name";


    name.textContent =
        activity.name;


    row.append(
        name,
        createHoursField(),
        createMinutesField()
    );


    return row;
}


/* =====================================================
   СВОИ КАТЕГОРИИ
===================================================== */

function addCustomActivity(
    data = null
) {

    let assignedId;


    if (
        data?.customId !=
        null
    ) {

        assignedId =
            Number(
                data.customId
            );

        customCounter =
            Math.max(
                customCounter,
                assignedId
            );

    } else if (
        data?.id &&
        String(
            data.id
        ).startsWith(
            "custom-"
        )
    ) {

        assignedId =
            Number(
                String(
                    data.id
                ).slice(
                    7
                )
            );

        customCounter =
            Math.max(
                customCounter,
                assignedId
            );

    } else {

        customCounter += 1;

        assignedId =
            customCounter;
    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "activity-row custom-row";


    row.dataset.custom =
        "true";


    row.dataset.customId =
        assignedId;


    const nameField =
        document.createElement(
            "div"
        );


    nameField.className =
        "field activity-name";


    const label =
        document.createElement(
            "label"
        );


    label.textContent =
        "Название дела";


    const nameInput =
        document.createElement(
            "input"
        );


    nameInput.type =
        "text";


    nameInput.maxLength =
        100;


    nameInput.placeholder =
        "Например: университет";


    nameInput.className =
        "custom-name";


    nameInput.value =
        data?.name || "";


    nameField.append(
        label,
        nameInput
    );


    const hoursField =
        createHoursField();


    const minutesField =
        createMinutesField();


    if (data) {

        hoursField
            .querySelector(
                "input"
            )
            .value =
            Math.floor(
                data.minutes /
                60
            );


        minutesField
            .querySelector(
                "select"
            )
            .value =
            data.minutes %
            60;
    }


    const remove =
        document.createElement(
            "button"
        );


    remove.type =
        "button";


    remove.className =
        "remove-btn";


    remove.textContent =
        "×";


    remove.addEventListener(
        "click",
        () => {

            row.remove();

            updateSummary();

            scheduleSaveDraft();

            refreshLiveResults();
        }
    );


    row.append(
        nameField,
        hoursField,
        minutesField,
        remove
    );


    customActivities
        .appendChild(
            row
        );

    if (
        !restoringDraft
    ) {

        scheduleSaveDraft();
    }

    refreshLiveResults();
}


/* =====================================================
   ЧТЕНИЕ ВРЕМЕНИ
===================================================== */

function rowMinutes(
    row
) {

    const hours =
        clamp(
            row.querySelector(
                ".hours-input"
            )?.value,
            0,
            24
        );


    const minutes =
        clamp(
            row.querySelector(
                ".minutes-input"
            )?.value,
            0,
            59
        );


    return (
        Math.round(
            hours
        ) *
        60 +
        Math.round(
            minutes
        )
    );
}


function getActivityData() {

    const data =
        [];


    defaultActivities
        .querySelectorAll(
            ".activity-row"
        )
        .forEach(
            row => {

                data.push({

                    id:
                        row.dataset.id,

                    name:
                        row.dataset.name,

                    minutes:
                        rowMinutes(
                            row
                        ),

                    custom:
                        false
                });
            }
        );


    customActivities
        .querySelectorAll(
            ".activity-row"
        )
        .forEach(
            row => {

                const name =
                    row.querySelector(
                        ".custom-name"
                    )
                    .value
                    .trim();


                const minutes =
                    rowMinutes(
                        row
                    );


                if (
                    name ||
                    minutes > 0
                ) {

                    data.push({

                        id:
                            "custom-" +
                            row.dataset
                                .customId,

                        name:
                            name ||
                            "Своё дело",

                        minutes,

                        custom:
                            true
                    });
                }
            }
        );


    return data;
}


function totalDistributed() {

    return getActivityData()
        .reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.minutes,
            0
        );
}


function currentPromotion() {

    const row =
        defaultActivities
            .querySelector(
                '[data-id="promotion"]'
            );


    return row
        ? rowMinutes(
            row
        )
        : 0;
}


/* =====================================================
   LIVE-СЧЁТЧИК
===================================================== */

function updateSummary() {

    const distributed =
        totalDistributed();


    const remaining =
        DAY_MINUTES -
        distributed;


    const promotion =
        currentPromotion();


    document.getElementById(
        "distributedTime"
    ).textContent =
        formatTime(
            distributed
        );


    document.getElementById(
        "remainingTime"
    ).textContent =
        remaining >= 0

            ? formatTime(
                remaining
            )

            : "0 мин";


    document.getElementById(
        "promotionTimeTop"
    ).textContent =
        formatTime(
            promotion
        );


    const percentage =
        Math.min(
            distributed /
            DAY_MINUTES *
            100,
            100
        );


    document.getElementById(
        "timelineFill"
    ).style.width =
        percentage +
        "%";


    const message =
        document.getElementById(
            "dayMessage"
        );


    message.className =
        "day-message";


    if (
        distributed ===
        DAY_MINUTES
    ) {

        message.textContent =
            "Ваш день полностью распределён.";

    } else if (
        distributed >
        DAY_MINUTES
    ) {

        message.className =
            "day-message warning";


        message.textContent =
            `Ваш день получился длиннее 24 часов на ` +
            `${formatTime(distributed - DAY_MINUTES)}. ` +
            `Возможно, некоторые дела идут одновременно ` +
            `или время стоит немного пересмотреть.`;

    } else {

        message.textContent =
            `Пока остаётся ` +
            `${formatTime(remaining)} ` +
            `нераспределённого времени.`;
    }
}


/* =====================================================
   ЦЕЛЬ
===================================================== */

function chooseGoal(
    button
) {

    document
        .querySelectorAll(
            ".goal-button"
        )
        .forEach(
            item =>
                item
                    .classList
                    .remove(
                        "active"
                    )
        );


    button.classList.add(
        "active"
    );


    if (
        button.dataset.custom ===
        "true"
    ) {

        customGoalSelected =
            true;


        selectedGoalMinutes =
            null;


        customGoalFields
            .classList
            .remove(
                "hidden"
            );

    } else {

        customGoalSelected =
            false;


        selectedGoalMinutes =
            Number(
                button.dataset
                    .minutes
            );


        customGoalFields
            .classList
            .add(
                "hidden"
            );
    }
}


function desiredPromotion() {

    if (
        customGoalSelected
    ) {

        return (
            clamp(
                goalHours.value,
                0,
                24
            ) *
            60 +

            clamp(
                goalMinutes.value,
                0,
                59
            )
        );
    }


    return selectedGoalMinutes;
}


const GOAL_REQUIRED_MESSAGE =
    "Укажите, сколько времени вы хотели бы выделять на продвижение своей практики.";


function hasPromotionGoal() {

    return (
        customGoalSelected ||
        selectedGoalMinutes !==
        null
    );
}


function refreshLiveResults() {

    if (
        restoringDraft ||
        !liveResultsActive
    ) {

        return;
    }


    updateSummary();

    const distributed =
        totalDistributed();


    if (
        distributed >
        DAY_MINUTES
    ) {

        resultSection
            .classList
            .add(
                "hidden"
            );

        reviewSection
            .classList
            .add(
                "hidden"
            );

        return;
    }


    if (
        !hasPromotionGoal()
    ) {

        resultSection
            .classList
            .add(
                "hidden"
            );

        reviewSection
            .classList
            .add(
                "hidden"
            );

        return;
    }


    calculate(
        false
    );
}


/* =====================================================
   ВЫВОД РЕЗУЛЬТАТА
===================================================== */

function calculate(
    scrollToResult = true
) {

    const distributed =
        totalDistributed();


    if (
        distributed >
        DAY_MINUTES
    ) {

        resultSection
            .classList
            .add(
                "hidden"
            );

        reviewSection
            .classList
            .add(
                "hidden"
            );

        if (
            scrollToResult
        ) {

            updateSummary();

            requestAnimationFrame(
                () => {

                    smoothScrollTo(
                        document.getElementById(
                            "dayMessage"
                        )
                    );
                }
            );
        }

        return false;
    }


    if (
        !hasPromotionGoal()
    ) {

        resultSection
            .classList
            .add(
                "hidden"
            );

        reviewSection
            .classList
            .add(
                "hidden"
            );


        if (
            scrollToResult
        ) {

            alert(
                GOAL_REQUIRED_MESSAGE
            );
        }

        return false;
    }


    const goal =
        desiredPromotion();


    const free =
        Math.max(
            DAY_MINUTES -
            distributed,
            0
        );


    const current =
        currentPromotion();


    const shortage =
        goal -
        current;


    document.getElementById(
        "resultDistributed"
    ).textContent =
        formatTime(
            distributed
        );


    document.getElementById(
        "resultFree"
    ).textContent =
        formatTime(
            free
        );


    document.getElementById(
        "resultCurrent"
    ).textContent =
        formatTime(
            current
        );


    const shortageLabel =
        document.getElementById(
            "shortageLabel"
        );


    const resultShortage =
        document.getElementById(
            "resultShortage"
        );


    document.getElementById(
        "resultGoal"
    ).textContent =
        formatTime(
            goal
        );


    if (
        shortage >
        0
    ) {

        shortageLabel.textContent =
            "Не хватает";


        resultShortage.textContent =
            formatTime(
                shortage
            );

    } else if (
        shortage ===
        0
    ) {

        shortageLabel.textContent =
            "Не хватает";


        resultShortage.textContent =
            "0 мин";

    } else {

        shortageLabel.textContent =
            "Больше цели на";


        resultShortage.textContent =
            formatTime(
                Math.abs(
                    shortage
                )
            );
    }


    renderMainAnswer({
        free,
        current,
        goal,
        shortage
    });


    renderGoalBars(
        current,
        goal
    );


    renderDayChart(
        getActivityData(),
        free
    );


    renderTopCategories(
        getActivityData()
    );


    renderReview(
        getActivityData(),
        shortage,
        free
    );


    resultSection
        .classList
        .remove(
            "hidden"
        );


    reviewSection
        .classList
        .add(
            "hidden"
        );


    liveResultsActive =
        true;


    if (
        scrollToResult
    ) {

        requestAnimationFrame(
            () => {

                resultSection
                    .scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    });
            }
        );
    }


    return true;
}


/* =====================================================
   ГЛАВНЫЙ ВЫВОД
===================================================== */

function renderMainAnswer(
    data
) {

    const title =
        document.getElementById(
            "mainAnswerTitle"
        );


    const text =
        document.getElementById(
            "mainAnswerText"
        );


    const extra =
        document.getElementById(
            "mainAnswerExtra"
        );


    extra.textContent =
        "";


    if (
        data.shortage <= 0
    ) {

        title.textContent =
            "Дополнительное время искать не нужно";


        text.textContent =
            "Вы уже выделяете на продвижение столько времени, сколько планировали.";


        extra.textContent =
            "Возможно, сейчас полезнее посмотреть не на количество часов, " +
            "а на то, насколько комфортно и эффективно вы используете уже выделенное время.";


        return;
    }


    if (
        data.free >=
        data.shortage
    ) {

        title.textContent =
            `Нужные ${formatTime(data.shortage)} уже есть в вашем дне`;


        text.textContent =
            "Вам не нужно увеличивать продолжительность рабочего дня.";


        extra.textContent =
            `Из нераспределённого времени можно выделить ` +
            `${formatTime(data.shortage)} на продвижение ` +
            `и всё равно сохранить остальной свободный ресурс.`;


        return;
    }


    if (
        data.free > 0 &&
        data.free <
        data.shortage
    ) {

        const left =
            data.shortage -
            data.free;


        title.textContent =
            "Часть времени уже найдена";


        text.textContent =
            `Из необходимых ${formatTime(data.shortage)} ` +
            `у вас уже есть ${formatTime(data.free)} свободного времени.`;


        extra.textContent =
            `Осталось освободить ещё ` +
            `${formatTime(left)} ` +
            `внутри существующего расписания.`;


        return;
    }


    title.textContent =
        `Нужно освободить ` +
        `${formatTime(data.shortage)}`;


    text.textContent =
        "Ваш день уже полностью распределён.";


    extra.textContent =
        "Задача не в том, чтобы добавить ещё один рабочий час, " +
        "а в том, чтобы найти, что можно немного сократить, " +
        "упростить, объединить, перенести или делегировать.";
}


/* =====================================================
   ПОЛОСЫ ЦЕЛИ
===================================================== */

function renderGoalBars(
    current,
    goal
) {

    document.getElementById(
        "currentProgressText"
    ).textContent =
        formatTime(
            current
        );


    document.getElementById(
        "goalProgressText"
    ).textContent =
        formatTime(
            goal
        );


    const maximum =
        Math.max(
            goal,
            current,
            1
        );


    document.getElementById(
        "currentProgressBar"
    ).style.width =
        Math.min(
            current /
            maximum *
            100,
            100
        ) +
        "%";


    document.getElementById(
        "goalProgressBar"
    ).style.width =
        Math.min(
            goal /
            maximum *
            100,
            100
        ) +
        "%";
}


/* =====================================================
   ДИАГРАММА ДНЯ (ГОРИЗОНТАЛЬНЫЕ ПОЛОСЫ)
===================================================== */

function getChartColorForId(
    id
) {

    if (
        CHART_COLOR_BY_ID[
            id
        ]
    ) {

        return CHART_COLOR_BY_ID[
            id
        ];
    }


    if (
        String(
            id
        ).startsWith(
            "custom-"
        )
    ) {

        const customNum =
            Number(
                String(
                    id
                ).slice(
                    7
                )
            ) || 1;


        const paletteIndex =
            (
                customNum -
                1
            ) %
            CUSTOM_ACTIVITY_CHART_COLORS.length;


        return CUSTOM_ACTIVITY_CHART_COLORS[
            paletteIndex
        ];
    }


    return CUSTOM_ACTIVITY_CHART_COLORS[
        0
    ];
}


function getDayChartItems(
    freeTime
) {

    const items =
        [];


    ACTIVITIES.forEach(
        activity => {

            const row =
                defaultActivities
                    .querySelector(
                        `[data-id="${activity.id}"]`
                    );


            const minutes =
                row
                    ? rowMinutes(
                        row
                    )
                    : 0;


            items.push({

                id:
                    activity.id,

                name:
                    activity.name,

                minutes,

                color:
                    getChartColorForId(
                        activity.id
                    )
            });
        }
    );


    customActivities
        .querySelectorAll(
            ".activity-row"
        )
        .forEach(
            row => {

                const customId =
                    row.dataset
                        .customId;


                const id =
                    "custom-" +
                    customId;


                const name =
                    row
                        .querySelector(
                            ".custom-name"
                        )
                        .value
                        .trim() ||
                    "Своё дело";


                items.push({

                    id,

                    name,

                    minutes:
                        rowMinutes(
                            row
                        ),

                    color:
                        getChartColorForId(
                            id
                        )
                });
            }
        );


    const freeMinutes =
        Math.max(
            freeTime,
            0
        );


    items.push({

        id:
            FREE_TIME_CHART_ID,

        name:
            "Свободное время",

        minutes:
            freeMinutes,

        color:
            getChartColorForId(
                FREE_TIME_CHART_ID
            )
    });


    return items;
}


function renderDayChart(
    activities,
    freeTime
) {

    const container =
        document.getElementById(
            "dayBarChart"
        );


    if (
        !container
    ) {

        return;
    }


    const items =
        getDayChartItems(
            freeTime
        );


    container.replaceChildren();


    items.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "day-bar-row";


            row.dataset.chartId =
                item.id;


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "day-bar-header";


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "day-bar-name";


            name.textContent =
                item.name;


            const time =
                document.createElement(
                    "span"
                );


            time.className =
                "day-bar-time";


            time.textContent =
                formatTime(
                    item.minutes
                );


            header.append(
                name,
                time
            );


            const track =
                document.createElement(
                    "div"
                );


            track.className =
                "day-bar-track";


            const fill =
                document.createElement(
                    "div"
                );


            fill.className =
                "day-bar-fill";


            const share =
                (
                    item.minutes /
                    DAY_MINUTES
                ) *
                100;


            fill.style.width =
                share +
                "%";


            fill.style.backgroundColor =
                item.color;


            track.appendChild(
                fill
            );


            row.append(
                header,
                track
            );


            container.appendChild(
                row
            );
        }
    );
}


/* =====================================================
   СКАЧИВАНИЕ ИТОГА ДНЯ (PNG)
===================================================== */

const PNG_STYLE = {
    width:
        1080,
    scale:
        2,
    margin:
        24,
    headerHeight:
        80,
    innerPad:
        24,
    font:
        'Segoe UI, Arial, sans-serif',
    bg:
        "#f6f7f4",
    card:
        "#ffffff",
    header:
        "#58796b",
    text:
        "#26332e",
    muted:
        "#6f7b75",
    border:
        "#dde4df",
    soft:
        "#e9f0ec",
    track:
        "#eef2ef",
    fontTitle:
        38,
    fontDate:
        30,
    fontSection:
        30,
    fontName:
        28,
    fontTime:
        28,
    fontMetricTitle:
        30,
    fontMetricLabel:
        26,
    fontMetricValue:
        28,
    fontFooter:
        17,
    lineHeightName:
        36,
    colName:
        304,
    colTime:
        188,
    colGap:
        12,
    barHeight:
        22,
    rowGap:
        10,
    gapHeaderToSection:
        40,
    metricTitleToFirstRow:
        66,
    metricRowStep:
        38,
    metricBoxBottomPad:
        16
};


function buildPngFilename() {

    const raw =
        dayDate.value ||
        getLocalToday();


    const [
        year,
        month,
        day
    ] =
        raw.split(
            "-"
        );


    return (
        `Итог_дня_${day}-${month}-${year}.png`
    );
}


function getDayExportPromotionResult(
    goal,
    current
) {

    const shortage =
        goal -
        current;


    if (
        shortage >
        0
    ) {

        return (
            `Не хватило ${formatTime(shortage)}`
        );
    }


    if (
        shortage ===
        0
    ) {

        return (
            "Цель выполнена"
        );
    }


    return (
        `Больше запланированного на ${formatTime(
            Math.abs(
                shortage
            )
        )}`
    );
}


function validateDayExport() {

    updateSummary();

    const distributed =
        totalDistributed();


    if (
        distributed >
        DAY_MINUTES
    ) {

        return {
            ok:
                false,
            message:
                `Ваш день получился длиннее 24 часов на ` +
                `${formatTime(distributed - DAY_MINUTES)}. ` +
                `Исправьте время, чтобы скачать итог.`
        };
    }


    if (
        !hasPromotionGoal()
    ) {

        return {
            ok:
                false,
            message:
                GOAL_REQUIRED_MESSAGE
        };
    }


    if (
        !dayDate.value
    ) {

        return {
            ok:
                false,
            message:
                "Укажите дату дня."
        };
    }


    return {
        ok:
            true
    };
}


function wrapCanvasLines(
    ctx,
    text,
    maxWidth
) {

    const words =
        String(
            text
        ).split(
            /\s+/
        )
        .filter(
            Boolean
        );


    if (
        words.length ===
        0
    ) {

        return [
            ""
        ];
    }


    const lines =
        [];


    let line =
        "";


    words.forEach(
        word => {

            const trial =
                line

                    ? (
                        line +
                        " " +
                        word
                    )

                    : word;


            if (
                ctx.measureText(
                    trial
                ).width >
                    maxWidth &&
                line
            ) {

                lines.push(
                    line
                );

                line =
                    word;

            } else {

                line =
                    trial;
            }
        }
    );


    if (
        line
    ) {

        lines.push(
            line
        );
    }


    return lines;
}


function getPngChartItems(
    freeTime
) {

    return getDayChartItems(
        freeTime
    ).filter(
        item =>
            item.minutes >
            0
    );
}


function getPngInnerWidth() {

    const cardW =
        PNG_STYLE.width -
        PNG_STYLE.margin *
        2;

    return (
        cardW -
        PNG_STYLE.innerPad *
        2
    );
}


function getPngBarWidth() {

    return (
        getPngInnerWidth() -
        PNG_STYLE.colName -
        PNG_STYLE.colTime -
        PNG_STYLE.colGap *
        2
    );
}


function measurePngChartRow(
    ctx,
    item
) {

    ctx.font =
        `600 ${PNG_STYLE.fontName}px ${PNG_STYLE.font}`;

    const nameLines =
        wrapCanvasLines(
            ctx,
            item.name,
            PNG_STYLE.colName -
            4
        );


    const nameHeight =
        nameLines.length *
        PNG_STYLE.lineHeightName;


    const rowBody =
        Math.max(
            nameHeight,
            PNG_STYLE.barHeight,
            PNG_STYLE.lineHeightName
        );


    return {
        nameLines,
        rowHeight:
            rowBody +
            PNG_STYLE.rowGap
    };
}


function measurePngChartBlock(
    ctx,
    items
) {

    let total =
        0;


    items.forEach(
        item => {

            total +=
                measurePngChartRow(
                    ctx,
                    item
                ).rowHeight;
        }
    );


    return total;
}


function metricBoxHeight(
    rowCount
) {

    return (
        PNG_STYLE.metricTitleToFirstRow +
        rowCount *
        PNG_STYLE.metricRowStep +
        PNG_STYLE.metricBoxBottomPad
    );
}


function computePngCanvasHeight(
    ctx,
    items
) {

    const cardY =
        PNG_STYLE.margin;

    const contentTop =
        cardY +
        PNG_STYLE.headerHeight +
        PNG_STYLE.gapHeaderToSection;


    let y =
        contentTop +
        34 +
        measurePngChartBlock(
            ctx,
            items
        ) +
        18;


    y +=
        metricBoxHeight(
            2
        ) +
        12;


    y +=
        metricBoxHeight(
            3
        ) +
        14 +
        PNG_STYLE.fontFooter +
        10;


    return (
        y +
        PNG_STYLE.margin
    );
}


function fillRoundRect(
    ctx,
    x,
    y,
    w,
    h,
    r
) {

    const radius =
        Math.min(
            r,
            w /
            2,
            h /
            2
        );


    ctx.beginPath();

    ctx.moveTo(
        x +
        radius,
        y
    );

    ctx.arcTo(
        x +
        w,
        y,
        x +
        w,
        y +
        h,
        radius
    );

    ctx.arcTo(
        x +
        w,
        y +
        h,
        x,
        y +
        h,
        radius
    );

    ctx.arcTo(
        x,
        y +
        h,
        x,
        y,
        radius
    );

    ctx.arcTo(
        x,
        y,
        x +
        w,
        y,
        radius
    );

    ctx.closePath();

    ctx.fill();
}


function drawMetricBox(
    ctx,
    x,
    y,
    w,
    h,
    title,
    rows
) {

    ctx.fillStyle =
        PNG_STYLE.soft;

    fillRoundRect(
        ctx,
        x,
        y,
        w,
        h,
        16
    );


    ctx.strokeStyle =
        PNG_STYLE.border;

    ctx.lineWidth =
        1;

    ctx.stroke();


    ctx.fillStyle =
        PNG_STYLE.text;

    ctx.font =
        `700 ${PNG_STYLE.fontMetricTitle}px ${PNG_STYLE.font}`;

    ctx.fillText(
        title,
        x +
        18,
        y +
        30
    );


    let rowY =
        y +
        PNG_STYLE.metricTitleToFirstRow;


    rows.forEach(
        row => {

            ctx.font =
                `500 ${PNG_STYLE.fontMetricLabel}px ${PNG_STYLE.font}`;

            ctx.fillStyle =
                PNG_STYLE.muted;

            ctx.fillText(
                row.label,
                x +
                18,
                rowY
            );


            ctx.font =
                `700 ${PNG_STYLE.fontMetricValue}px ${PNG_STYLE.font}`;

            ctx.fillStyle =
                PNG_STYLE.text;

            ctx.textAlign =
                "right";

            ctx.fillText(
                row.value,
                x +
                w -
                18,
                rowY
            );


            ctx.textAlign =
                "left";

            rowY +=
                PNG_STYLE.metricRowStep;
        }
    );
}


function renderDaySummaryToCanvas(
    canvas
) {

    const distributed =
        totalDistributed();


    const free =
        Math.max(
            DAY_MINUTES -
            distributed,
            0
        );


    const goal =
        desiredPromotion();


    const current =
        currentPromotion();


    const items =
        getPngChartItems(
            free
        );


    const probe =
        document
            .createElement(
                "canvas"
            )
            .getContext(
                "2d"
            );


    const canvasHeight =
        computePngCanvasHeight(
            probe,
            items
        );


    const scale =
        PNG_STYLE.scale;


    canvas.width =
        PNG_STYLE.width *
        scale;


    canvas.height =
        canvasHeight *
        scale;


    const ctx =
        canvas.getContext(
            "2d"
        );


    ctx.scale(
        scale,
        scale
    );


    ctx.fillStyle =
        PNG_STYLE.bg;

    ctx.fillRect(
        0,
        0,
        PNG_STYLE.width,
        canvasHeight
    );


    const cardX =
        PNG_STYLE.margin;


    const cardY =
        PNG_STYLE.margin;


    const cardW =
        PNG_STYLE.width -
        PNG_STYLE.margin *
        2;


    const cardH =
        canvasHeight -
        PNG_STYLE.margin *
        2;


    ctx.fillStyle =
        PNG_STYLE.card;

    fillRoundRect(
        ctx,
        cardX,
        cardY,
        cardW,
        cardH,
        20
    );


    ctx.strokeStyle =
        PNG_STYLE.border;

    ctx.lineWidth =
        1;

    ctx.stroke();


    ctx.fillStyle =
        PNG_STYLE.header;

    ctx.beginPath();

    ctx.moveTo(
        cardX +
        20,
        cardY
    );

    ctx.arcTo(
        cardX +
        cardW,
        cardY,
        cardX +
        cardW,
        cardY +
        20,
        20
    );

    ctx.lineTo(
        cardX +
        cardW,
        cardY +
        PNG_STYLE.headerHeight -
        20
    );

    ctx.arcTo(
        cardX +
        cardW,
        cardY +
        PNG_STYLE.headerHeight,
        cardX +
        cardW -
        20,
        cardY +
        PNG_STYLE.headerHeight,
        20
    );

    ctx.lineTo(
        cardX +
        20,
        cardY +
        PNG_STYLE.headerHeight
    );

    ctx.arcTo(
        cardX,
        cardY +
        PNG_STYLE.headerHeight,
        cardX,
        cardY +
        PNG_STYLE.headerHeight -
        20,
        20
    );

    ctx.lineTo(
        cardX,
        cardY +
        20
    );

    ctx.arcTo(
        cardX,
        cardY,
        cardX +
        20,
        cardY,
        20
    );

    ctx.closePath();

    ctx.fill();


    const headerCenterY =
        cardY +
        PNG_STYLE.headerHeight /
        2;

    const headerTextLeft =
        cardX +
        PNG_STYLE.innerPad;

    const headerTextRight =
        cardX +
        cardW -
        PNG_STYLE.innerPad;

    ctx.fillStyle =
        "#ffffff";

    ctx.textBaseline =
        "middle";

    ctx.textAlign =
        "left";

    ctx.font =
        `700 ${PNG_STYLE.fontTitle}px ${PNG_STYLE.font}`;

    ctx.fillText(
        "Мой день в цифрах",
        headerTextLeft,
        headerCenterY
    );


    ctx.font =
        `500 ${PNG_STYLE.fontDate}px ${PNG_STYLE.font}`;

    ctx.textAlign =
        "right";

    ctx.fillText(
        formatDate(
            dayDate.value
        ),
        headerTextRight,
        headerCenterY
    );


    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "alphabetic";


    const innerX =
        cardX +
        PNG_STYLE.innerPad;


    const innerWidth =
        getPngInnerWidth();


    const nameX =
        innerX;


    const barX =
        innerX +
        PNG_STYLE.colName +
        PNG_STYLE.colGap;


    const barW =
        getPngBarWidth();


    const timeX =
        barX +
        barW +
        PNG_STYLE.colGap;


    let y =
        cardY +
        PNG_STYLE.headerHeight +
        PNG_STYLE.gapHeaderToSection;


    ctx.fillStyle =
        PNG_STYLE.text;

    ctx.font =
        `700 ${PNG_STYLE.fontSection}px ${PNG_STYLE.font}`;

    ctx.fillText(
        "Куда уходят ваши 24 часа",
        innerX,
        y
    );


    y +=
        34;


    items.forEach(
        item => {

            const measured =
                measurePngChartRow(
                    ctx,
                    item
                );


            const nameLines =
                measured.nameLines;


            const rowHeight =
                measured.rowHeight;


            const rowBody =
                rowHeight -
                PNG_STYLE.rowGap;


            const rowMid =
                y +
                rowBody /
                2;


            ctx.textAlign =
                "left";

            ctx.fillStyle =
                PNG_STYLE.text;

            ctx.font =
                `600 ${PNG_STYLE.fontName}px ${PNG_STYLE.font}`;


            const nameStartY =
                y +
                (
                    rowBody -
                    nameLines.length *
                    PNG_STYLE.lineHeightName
                ) /
                2 +
                PNG_STYLE.lineHeightName -
                6;


            nameLines.forEach(
                (
                    line,
                    index
                ) => {

                    ctx.fillText(
                        line,
                        nameX,
                        nameStartY +
                        index *
                        PNG_STYLE.lineHeightName
                    );
                }
            );


            const trackY =
                rowMid -
                PNG_STYLE.barHeight /
                2;


            ctx.fillStyle =
                PNG_STYLE.track;

            fillRoundRect(
                ctx,
                barX,
                trackY,
                barW,
                PNG_STYLE.barHeight,
                10
            );


            const fillW =
                (
                    item.minutes /
                    DAY_MINUTES
                ) *
                barW;


            if (
                fillW >
                0
            ) {

                ctx.fillStyle =
                    item.color;

                fillRoundRect(
                    ctx,
                    barX,
                    trackY,
                    fillW,
                    PNG_STYLE.barHeight,
                    10
                );
            }


            const timeText =
                formatTime(
                    item.minutes
                );


            ctx.textAlign =
                "right";

            ctx.font =
                `700 ${PNG_STYLE.fontTime}px ${PNG_STYLE.font}`;

            ctx.fillText(
                timeText,
                timeX +
                PNG_STYLE.colTime,
                rowMid +
                10
            );

            ctx.textAlign =
                "left";

            y +=
                rowHeight;
        }
    );


    y +=
        18;


    const summaryBoxHeight =
        metricBoxHeight(
            2
        );


    drawMetricBox(
        ctx,
        innerX,
        y,
        innerWidth,
        summaryBoxHeight,
        "Итоги дня",
        [
            {
                label:
                    "Распределено за день",
                value:
                    formatTime(
                        distributed
                    )
            },
            {
                label:
                    "Осталось свободного времени",
                value:
                    formatTime(
                        free
                    )
            }
        ]
    );


    y +=
        summaryBoxHeight +
        12;


    const promoBoxHeight =
        metricBoxHeight(
            3
        );


    drawMetricBox(
        ctx,
        innerX,
        y,
        innerWidth,
        promoBoxHeight,
        "Время на продвижение",
        [
            {
                label:
                    "Хотели выделить",
                value:
                    formatTime(
                        goal
                    )
            },
            {
                label:
                    "Фактически выделили",
                value:
                    formatTime(
                        current
                    )
            },
            {
                label:
                    "Результат дня",
                value:
                    getDayExportPromotionResult(
                        goal,
                        current
                    )
            }
        ]
    );


    y +=
        promoBoxHeight +
        14;


    ctx.fillStyle =
        PNG_STYLE.muted;

    ctx.font =
        `400 ${PNG_STYLE.fontFooter}px ${PNG_STYLE.font}`;

    ctx.textAlign =
        "center";

    ctx.fillText(
        "Автор проекта — Мария Коренева",
        cardX +
        cardW /
        2,
        y +
        PNG_STYLE.fontFooter
    );


    ctx.textAlign =
        "left";


    return true;
}


function downloadDayPng() {

    const validation =
        validateDayExport();


    if (
        !validation.ok
    ) {

        alert(
            validation.message
        );

        return;
    }


    const canvas =
        document.createElement(
            "canvas"
        );


    renderDaySummaryToCanvas(
        canvas
    );


    canvas.toBlob(
        blob => {

            if (
                !blob
            ) {

                alert(
                    "Не удалось создать изображение. Попробуйте ещё раз."
                );

                return;
            }


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                buildPngFilename();


            link.click();


            URL.revokeObjectURL(
                url
            );
        },
        "image/png"
    );
}


/* =====================================================
   ТОП КАТЕГОРИЙ
===================================================== */

function renderTopCategories(
    activities
) {

    const container =
        document.getElementById(
            "topCategories"
        );


    container.replaceChildren();


    const top =
        activities
            .filter(
                item =>
                    item.minutes > 0
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.minutes -
                    a.minutes
            )
            .slice(
                0,
                5
            );


    if (
        top.length === 0
    ) {

        const empty =
            document.createElement(
                "p"
            );


        empty.className =
            "hint";


        empty.textContent =
            "Вы пока не указали время.";


        container.appendChild(
            empty
        );


        return;
    }


    top.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "top-item";


            const name =
                document.createElement(
                    "strong"
                );


            name.textContent =
                item.name;


            const time =
                document.createElement(
                    "strong"
                );


            time.textContent =
                formatTime(
                    item.minutes
                );


            row.append(
                name,
                time
            );


            container.appendChild(
                row
            );
        }
    );
}


/* =====================================================
   ГДЕ ОСВОБОДИТЬ
===================================================== */

function renderReview(
    activities,
    shortage,
    free
) {

    const container =
        document.getElementById(
            "reviewList"
        );


    container.replaceChildren();


    const sorted =
        activities
            .filter(
                item =>
                    item.minutes > 0
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.minutes -
                    a.minutes
            );


    sorted.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "review-item";


            const text =
                document.createElement(
                    "div"
                );


            const name =
                document.createElement(
                    "strong"
                );


            name.textContent =
                item.name;


            const note =
                document.createElement(
                    "span"
                );


            note.textContent =
                "Можно ли что-то изменить здесь — решаете только вы.";


            text.append(
                name,
                note
            );


            const time =
                document.createElement(
                    "span"
                );


            time.className =
                "review-time";


            time.textContent =
                formatTime(
                    item.minutes
                );


            row.append(
                text,
                time
            );


            container.appendChild(
                row
            );
        }
    );


    const goalText =
        document.getElementById(
            "reviewGoalText"
        );


    if (
        shortage <= 0
    ) {

        goalText.textContent =
            "Вы уже достигли выбранной цели по времени на продвижение.";

    } else if (
        free >=
        shortage
    ) {

        goalText.textContent =
            `Вам достаточно использовать ` +
            `${formatTime(shortage)} ` +
            `из уже существующего свободного времени.`;

    } else {

        const need =
            Math.max(
                shortage -
                free,
                0
            );


        goalText.textContent =
            `Попробуйте найти в расписании ещё ` +
            `${formatTime(need)}. ` +
            `Не обязательно освобождать всё время из одной категории — ` +
            `это могут быть несколько небольших изменений.`;
    }
}


/* =====================================================
   ЗАВЕРШЕНИЕ ДНЯ / НОВЫЙ ДЕНЬ
===================================================== */

function getScrollOffsetForStickyHeader() {

    const header =
        document.querySelector(
            ".site-header"
        );


    if (
        !header
    ) {

        return (
            20
        );
    }


    return (
        Math.ceil(
            header
                .getBoundingClientRect()
                .height
        ) +
        16
    );
}


function smoothScrollTo(
    element
) {

    if (
        !element
    ) {

        return;
    }


    const offset =
        getScrollOffsetForStickyHeader();


    const top =
        element
            .getBoundingClientRect()
            .top +
        window
            .scrollY -
        offset;


    window
        .scrollTo({
            top:
                Math.max(
                    0,
                    top
                ),
            behavior:
                "smooth"
        });
}


function scrollToNewDayBlock() {

    const button =
        document.getElementById(
            "startNewDayButton"
        );


    smoothScrollTo(
        button
    );
}


function finishDay() {

    updateSummary();

    const distributed =
        totalDistributed();


    if (
        distributed >
        DAY_MINUTES
    ) {

        smoothScrollTo(
            document.getElementById(
                "dayMessage"
            )
        );

        return;
    }


    if (
        !hasPromotionGoal()
    ) {

        alert(
            GOAL_REQUIRED_MESSAGE
        );

        return;
    }


    const ok =
        calculate(
            false
        );


    if (
        !ok
    ) {

        return;
    }


    requestAnimationFrame(
        () => {

            smoothScrollTo(
                document.getElementById(
                    "dayCompletionBlock"
                )
            );
        }
    );
}


function showNewDayConfirm() {

    const overlay =
        document.getElementById(
            "newDayConfirm"
        );


    if (
        overlay
    ) {

        overlay
            .classList
            .remove(
                "hidden"
            );
    }
}


function hideNewDayConfirm() {

    const overlay =
        document.getElementById(
            "newDayConfirm"
        );


    if (
        overlay
    ) {

        overlay
            .classList
            .add(
                "hidden"
            );
    }
}


function executeStartNewDay() {

    try {

        localStorage.removeItem(
            DRAFT_STORAGE_KEY
        );

    } catch {
        /* режим приватного просмотра */
    }


    resetInputValues();

    dayDate.value =
        getLocalToday();

    resultSection
        .classList
        .add(
            "hidden"
        );

    reviewSection
        .classList
        .add(
            "hidden"
        );

    liveResultsActive =
        false;

    updateSummary();

    saveDraft();

    hideNewDayConfirm();

    window.scrollTo({
        top:
            0,
        behavior:
            "smooth"
    });
}


/* =====================================================
   СБРОС ЗНАЧЕНИЙ ПОЛЕЙ
===================================================== */

function resetInputValues() {

    defaultActivities
        .querySelectorAll(
            ".activity-row"
        )
        .forEach(
            row => {

                row.querySelector(
                    ".hours-input"
                ).value =
                    0;


                row.querySelector(
                    ".minutes-input"
                ).value =
                    0;
            }
        );


    customActivities
        .replaceChildren();


    customCounter =
        0;


    document
        .querySelectorAll(
            ".goal-button"
        )
        .forEach(
            button =>
                button
                    .classList
                    .remove(
                        "active"
                    )
        );


    selectedGoalMinutes =
        null;


    customGoalSelected =
        false;


    customGoalFields
        .classList
        .add(
            "hidden"
        );


    goalHours.value =
        0;


    goalMinutes.value =
        0;


    updateSummary();
}


/* =====================================================
   ЧЕРНОВИК (АВТОСОХРАНЕНИЕ)
===================================================== */

function collectGoalDraft() {

    if (
        customGoalSelected
    ) {

        return {

            mode:
                "custom",

            hours:
                clamp(
                    goalHours.value,
                    0,
                    24
                ),

            minutes:
                clamp(
                    goalMinutes.value,
                    0,
                    59
                )
        };
    }


    if (
        selectedGoalMinutes !=
        null
    ) {

        return {

            mode:
                "preset",

            presetMinutes:
                selectedGoalMinutes
        };
    }


    return {
        mode:
            "none"
    };
}


function applyGoalFromDraft(
    goal
) {

    if (
        !goal ||
        goal.mode ===
        "none"
    ) {

        return;
    }


    if (
        goal.mode ===
        "custom"
    ) {

        const button =
            document.querySelector(
                '.goal-button[data-custom="true"]'
            );


        if (button) {

            chooseGoal(
                button
            );
        }


        goalHours.value =
            goal.hours ??
            0;


        goalMinutes.value =
            goal.minutes ??
            0;


        return;
    }


    const button =
        document.querySelector(
            `.goal-button[data-minutes="${goal.presetMinutes}"]`
        );


    if (button) {

        chooseGoal(
            button
        );
    }
}


function buildDraftFromForm() {

    const activities =
        {};


    defaultActivities
        .querySelectorAll(
            ".activity-row"
        )
        .forEach(
            row => {

                activities[
                    row.dataset.id
                ] = {

                    hours:
                        clamp(
                            row.querySelector(
                                ".hours-input"
                            ).value,
                            0,
                            24
                        ),

                    minutes:
                        clamp(
                            row.querySelector(
                                ".minutes-input"
                            ).value,
                            0,
                            59
                        )
                };
            }
        );


    const customList =
        [];


    customActivities
        .querySelectorAll(
            ".activity-row"
        )
        .forEach(
            row => {

                customList.push({

                    customId:
                        Number(
                            row.dataset
                                .customId
                        ),

                    name:
                        row
                            .querySelector(
                                ".custom-name"
                            )
                            .value,

                    minutes:
                        rowMinutes(
                            row
                        )
                });
            }
        );


    return {

        version:
            1,

        date:
            dayDate.value ||
            getLocalToday(),

        activities,

        customActivities:
            customList,

        customCounter,

        goal:
            collectGoalDraft()
    };
}


function saveDraft() {

    if (
        restoringDraft
    ) {

        return;
    }


    try {

        localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify(
                buildDraftFromForm()
            )
        );

    } catch {
        /* квота или режим приватного просмотра */
    }
}


function scheduleSaveDraft() {

    if (
        restoringDraft
    ) {

        return;
    }


    if (
        draftSaveTimer
    ) {

        clearTimeout(
            draftSaveTimer
        );
    }


    draftSaveTimer =
        setTimeout(
            saveDraft,
            400
        );
}


function loadDraftFromStorage() {

    try {

        const raw =
            localStorage.getItem(
                DRAFT_STORAGE_KEY
            );


        if (!raw) {

            return false;
        }


        const draft =
            JSON.parse(
                raw
            );


        applyDraft(
            draft
        );

        return true;

    } catch {

        return false;
    }
}


function applyDraft(
    draft
) {

    if (
        !draft ||
        typeof draft !==
        "object"
    ) {

        return;
    }


    restoringDraft =
        true;


    try {

        if (
            draft.date
        ) {

            dayDate.value =
                draft.date;
        }


        if (
            draft.activities &&
            typeof draft.activities ===
            "object"
        ) {

            Object.entries(
                draft.activities
            ).forEach(
                ([
                    id,
                    times
                ]) => {

                    const row =
                        defaultActivities
                            .querySelector(
                                `[data-id="${id}"]`
                            );


                    if (!row) {
                        return;
                    }


                    row.querySelector(
                        ".hours-input"
                    ).value =
                        times.hours ??
                        0;


                    row.querySelector(
                        ".minutes-input"
                    ).value =
                        times.minutes ??
                        0;
                }
            );
        }


        customActivities
            .replaceChildren();

        customCounter =
            0;


        if (
            Array.isArray(
                draft.customActivities
            )
        ) {

            draft.customActivities
                .forEach(
                    item =>
                        addCustomActivity(
                            item
                        )
                );

        }


        if (
            draft.customCounter >
            customCounter
        ) {

            customCounter =
                draft.customCounter;
        }


        applyGoalFromDraft(
            draft.goal
        );

        updateSummary();

    } finally {

        restoringDraft =
            false;
    }
}


/* =====================================================
   ИНИЦИАЛИЗАЦИЯ
===================================================== */

ACTIVITIES.forEach(
    activity => {

        defaultActivities
            .appendChild(
                createActivityRow(
                    activity
                )
            );
    }
);


makeMinuteOptions(
    goalMinutes
);


if (
    !loadDraftFromStorage()
) {

    dayDate.value =
        getLocalToday();
}


updateSummary();


/* =====================================================
   СОБЫТИЯ
===================================================== */

const startButton =
    document.getElementById(
        "startButton"
    );

if (
    startButton &&
    startScreen &&
    calculatorScreen
) {

    startButton.addEventListener(
        "click",
        () => {

            startScreen
                .classList
                .add(
                    "hidden"
                );


            calculatorScreen
                .classList
                .remove(
                    "hidden"
                );


            window.scrollTo({
                top:
                    0,

                behavior:
                    "smooth"
            });
        }
    );
}


document
    .getElementById(
        "addCustomButton"
    )
    .addEventListener(
        "click",
        () =>
            addCustomActivity()
    );


document.addEventListener(
    "input",
    event => {

        if (
            event.target.matches(
                ".hours-input"
            )
        ) {

            event.target.value =
                clamp(
                    event.target.value,
                    0,
                    24
                );


            updateSummary();

            scheduleSaveDraft();

            refreshLiveResults();
        }


        if (
            event.target ===
            goalHours
        ) {

            scheduleSaveDraft();

            refreshLiveResults();
        }


        if (
            event.target.matches(
                ".custom-name"
            )
        ) {

            scheduleSaveDraft();
        }
    }
);


document.addEventListener(
    "change",
    event => {

        if (
            event.target.matches(
                ".minutes-input"
            )
        ) {

            updateSummary();

            scheduleSaveDraft();

            refreshLiveResults();
        }


        if (
            event.target ===
            goalMinutes ||
            event.target ===
            dayDate
        ) {

            scheduleSaveDraft();

            if (
                event.target ===
                goalMinutes
            ) {

                refreshLiveResults();
            }
        }
    }
);


document
    .getElementById(
        "goalButtons"
    )
    .addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".goal-button"
                );


            if (button) {

                chooseGoal(
                    button
                );

                scheduleSaveDraft();

                refreshLiveResults();
            }
        }
    );


calculateButton
    .addEventListener(
        "click",
        () =>
            calculate(
                true
            )
    );


document
    .getElementById(
        "navFinishDay"
    )
    ?.addEventListener(
        "click",
        finishDay
    );


document
    .getElementById(
        "downloadDayPngButton"
    )
    ?.addEventListener(
        "click",
        downloadDayPng
    );


document
    .getElementById(
        "navStartNewDay"
    )
    ?.addEventListener(
        "click",
        scrollToNewDayBlock
    );


document
    .getElementById(
        "startNewDayButton"
    )
    ?.addEventListener(
        "click",
        showNewDayConfirm
    );


document
    .getElementById(
        "newDayConfirmCancel"
    )
    ?.addEventListener(
        "click",
        hideNewDayConfirm
    );


document
    .getElementById(
        "newDayConfirmOk"
    )
    ?.addEventListener(
        "click",
        executeStartNewDay
    );


document
    .getElementById(
        "editButton"
    )
    .addEventListener(
        "click",
        () => {

            resultSection
                .classList
                .add(
                    "hidden"
                );


            window.scrollTo({
                top:
                    0,

                behavior:
                    "smooth"
            });
        }
    );


document
    .getElementById(
        "reviewButton"
    )
    .addEventListener(
        "click",
        () => {

            reviewSection
                .classList
                .remove(
                    "hidden"
                );


            reviewSection
                .scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "start"
                });
        }
    );

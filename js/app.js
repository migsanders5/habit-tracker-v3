// -------------------------
// Constants
// -------------------------

const DAYS_TO_SHOW = 30;      // columns shown in the grid
const PERCENT_WINDOW = 10;    // eligible days used for the %

const ALL_DAYS = [0,1,2,3,4,5,6];

const DAY_LABELS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];



// -------------------------
// Load / Save
// -------------------------

function loadHabits(){

    let data;

    try{
        data = JSON.parse(
            localStorage.getItem("habits")
        );
    }
    catch(e){
        data = null;
    }

    if(!Array.isArray(data))
        data = [];


    // Upgrade habits saved by older versions
    data.forEach(habit=>{

        if(!habit.history)
            habit.history = {};

        if(!Array.isArray(habit.activeDays))
            habit.activeDays = ALL_DAYS.slice();

        if(typeof habit.inRoutine !== "boolean")
            habit.inRoutine = false;

    });

    return data;

}


let habits = loadHabits();


const habitGrid =
    document.getElementById("habitGrid");


const addHabitBtn =
    document.getElementById("addHabitBtn");


const daysDialog =
    document.getElementById("daysDialog");

const daysDialogTitle =
    document.getElementById("daysDialogTitle");

const dayPicker =
    document.getElementById("dayPicker");

const daysError =
    document.getElementById("daysError");

const daysSaveBtn =
    document.getElementById("daysSaveBtn");

const daysCancelBtn =
    document.getElementById("daysCancelBtn");


let editingHabitId = null;



function saveHabits(){

    localStorage.setItem(
        "habits",
        JSON.stringify(habits)
    );

}



// -------------------------
// Dates
// -------------------------

function formatLocalDate(date){

    return date.getFullYear()
    + "-"
    + String(date.getMonth()+1).padStart(2,"0")
    + "-"
    + String(date.getDate()).padStart(2,"0");

}



function getToday(){

    return formatLocalDate(
        new Date()
    );

}



function parseDate(dateString){

    const parts =
        dateString.split("-");

    return new Date(
        parts[0],
        parts[1]-1,
        parts[2]
    );

}



function displayDate(dateString){

    return parseDate(dateString)
    .toLocaleDateString(
        undefined,
        {
            month:"short",
            day:"numeric"
        }
    );

}



function displayWeekday(dateString){

    return DAY_LABELS[
        parseDate(dateString).getDay()
    ].slice(0,3);

}



function getDates(){

    let dates=[];

    let today = new Date();


    for(let i=0;i<DAYS_TO_SHOW;i++){

        let d =
            new Date(today);


        d.setDate(
            today.getDate()-i
        );


        dates.push(
            formatLocalDate(d)
        );

    }


    return dates;

}



function escapeHtml(text){

    return String(text)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");

}



// -------------------------
// Eligible days + completion
// -------------------------

// A day is eligible if it is on/after the date the habit was added
// AND it falls on one of the weekdays the habit is scheduled for.

function isActiveDay(habit,dateString){

    return habit.activeDays.includes(
        parseDate(dateString).getDay()
    );

}



// % of the last PERCENT_WINDOW eligible days (ending today)
// that were completed. Full history is still stored.
// Returns null if there are no eligible days yet.

function completion(habit){

    if(habit.activeDays.length === 0)
        return null;


    let cursor = new Date();

    let eligible = 0;
    let done = 0;


    while(eligible < PERCENT_WINDOW){

        let key =
            formatLocalDate(cursor);


        if(key < habit.dateAdded)
            break;


        if(habit.activeDays.includes(cursor.getDay())){

            eligible++;

            if(habit.history[key])
                done++;

        }


        cursor.setDate(
            cursor.getDate()-1
        );

    }


    if(eligible === 0)
        return null;


    return Math.round(
        (done/eligible)*100
    );

}



// -------------------------
// Add Habit
// -------------------------

addHabitBtn.onclick = ()=>{


    let name =
        prompt("Habit name:");


    if(!name)
        return;



    habits.push({

        id:Date.now().toString(),

        name:name,

        dateAdded:getToday(),

        history:{},

        activeDays:ALL_DAYS.slice(),

        inRoutine:false

    });



    saveHabits();

    render();

};



// -------------------------
// Checkboxes
// -------------------------

function findHabit(id){

    return habits.find(
        h=>h.id===id
    );

}



function toggle(id,date,value){

    let habit = findHabit(id);

    if(!habit)
        return;


    habit.history[date]=value;


    saveHabits();

    render();

}



function setInRoutine(id,value){

    let habit = findHabit(id);

    if(!habit)
        return;


    habit.inRoutine = value;


    saveHabits();

    render();

}



// -------------------------
// Days-of-week dialog
// -------------------------

function openDaysDialog(id){

    let habit = findHabit(id);

    if(!habit)
        return;


    editingHabitId = id;


    daysDialogTitle.textContent =
        habit.name;


    // Monday-first order for display
    let order = [1,2,3,4,5,6,0];


    dayPicker.innerHTML = "";


    order.forEach(day=>{

        let label =
            document.createElement("label");


        let box =
            document.createElement("input");

        box.type = "checkbox";
        box.value = day;
        box.checked =
            habit.activeDays.includes(day);


        label.appendChild(box);

        label.appendChild(
            document.createTextNode(
                DAY_LABELS[day]
            )
        );


        dayPicker.appendChild(label);

    });


    daysError.hidden = true;

    daysDialog.showModal();

}



daysSaveBtn.onclick = ()=>{

    let habit = findHabit(editingHabitId);

    if(!habit)
        return;


    let selected = [];

    dayPicker.querySelectorAll("input")
    .forEach(box=>{

        if(box.checked)
            selected.push(
                Number(box.value)
            );

    });


    if(selected.length === 0){

        daysError.hidden = false;

        return;

    }


    habit.activeDays =
        selected.sort((a,b)=>a-b);


    saveHabits();

    daysDialog.close();

    render();

};



daysCancelBtn.onclick = ()=>{

    daysDialog.close();

};



// -------------------------
// Grid events (delegated)
// -------------------------

habitGrid.addEventListener(
    "change",
    event=>{

        let box = event.target;

        if(box.dataset.type === "day"){

            toggle(
                box.dataset.id,
                box.dataset.date,
                box.checked
            );

        }

        else if(box.dataset.type === "routine"){

            setInRoutine(
                box.dataset.id,
                box.checked
            );

        }

    }
);



habitGrid.addEventListener(
    "click",
    event=>{

        let btn =
            event.target.closest(".menu-btn");

        if(btn)
            openDaysDialog(btn.dataset.id);

    }
);



// -------------------------
// Render
// -------------------------

function render(){


    let scrollLeft =
        habitGrid.scrollLeft;


    habitGrid.innerHTML="";


    let dates =
        getDates();



    let table =
        document.createElement("table");



    let header =
`
<tr>

<th class="sticky-col habit-col">
Habit
</th>

<th class="sticky-col percent-col"
title="Last ${PERCENT_WINDOW} eligible days">
%
</th>

<th class="routine-col">
Added to Routine
</th>
`;



    dates.forEach(d=>{

        header +=
        `
        <th>
        ${displayDate(d)}<br>
        <small>${displayWeekday(d)}</small>
        </th>
        `;

    });


    header += "</tr>";



    table.innerHTML =
        "<thead>"
        +header+
        "</thead>";



    let body =
        document.createElement("tbody");



    habits.forEach(habit=>{


        let row =
            document.createElement("tr");


        let pct =
            completion(habit);


        let pctText =
            (pct === null) ? "—" : pct + "%";



        let html =
`
<td class="sticky-col habit-col">

<button
class="menu-btn"
data-id="${habit.id}"
title="Choose days of the week"
aria-label="Choose days of the week">⚙</button>

<span class="habit-text">
${escapeHtml(habit.name)}
</span>

</td>


<td class="sticky-col percent-col">
${pctText}
</td>


<td class="routine-col">

<input
type="checkbox"
data-type="routine"
data-id="${habit.id}"
${habit.inRoutine?"checked":""}
>

</td>
`;



        dates.forEach(date=>{


            if(date < habit.dateAdded){

                html +=
                `
                <td class="before-created">
                —
                </td>
                `;

            }

            else if(!isActiveDay(habit,date)){

                html +=
                `
                <td class="off-day">
                off
                </td>
                `;

            }

            else{


                html +=
                `
                <td>

                <input
                type="checkbox"
                data-type="day"
                data-id="${habit.id}"
                data-date="${date}"
                ${habit.history[date]?"checked":""}
                >

                </td>
                `;

            }


        });



        row.innerHTML=html;


        body.appendChild(row);


    });



    table.appendChild(body);


    habitGrid.appendChild(table);


    habitGrid.scrollLeft =
        scrollLeft;

}



render();

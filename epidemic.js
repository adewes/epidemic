// the number of healthy people in a given age cohort
// source: https://www.demografie-portal.de/SharedDocs/Informieren/DE/ZahlenFakten/Bevoelkerung_Altersstruktur.html

let healthyCohorts;
let allCohorts;
let totalSick = [];
let totalCured = [];
let totalHealthy = [];
let totalDeceased = [];
let dates = [];

let stopped = true;
let t = 0;
let initialSick = 200;
let paused = false;

// the mean duration of an infection
let sicknessDuration = 14;
// the mortality of the disease (in percent) for the different age groups

// https://www.worldometers.info/coronavirus/coronavirus-age-sex-demographics/
let mortalityPoints = [[10, 0.2], [40, 0.2], [50, 0.4], [60, 3.6], [70, 8.0], [80, 14.8], [100, 21.9]];

let mortality = [];
let j = 0;
let lm = 0.0;
let lage = 0;
for(let i=0;i<100;i++){
    let age = mortalityPoints[j][0];
    let m = mortalityPoints[j][1];
    let p = (i-lage)/(age-lage);
    v = p*m+(1-p)*lm;
    mortality.push(v);
    if (age == i){
        j++;
        lm = m;
        lage = age;
    }
}

// the overall infection rate of a sick person
let infectionRate = 2.6;

// the number of sick people in a given age cohort
// we store the number of sick people for each age cohort and days since infection 
let sickCohorts = [];
let allSickCohorts = [];
let curedCohorts = [];
let deceasedCohorts = [];

let dailyInfectionRate;

let dailyMortality = [];

function updateInfectionRate(){
    dailyInfectionRate = infectionRate/sicknessDuration;

}

function initialize(){

    t = 0;

    healthyCohorts = [783978, 796374, 802651, 776763, 766631, 739729, 736749, 720613, 738238, 726909, 746345, 741530, 726923, 735760, 751622, 752351, 766517, 787745, 835762, 861102, 891659, 934518, 929523, 916924, 934648, 967092, 985364, 1021919, 1116459, 1102501, 1127589, 1103635, 1083657, 1050793, 1043355, 1045184, 1065675, 1056516, 1060769, 1009272, 995070, 985641, 966513, 941433, 953081, 959668, 1038269, 1140019, 1180738, 1265825, 1323697, 1356220, 1389766, 1391794, 1414471, 1399366, 1351589, 1327937, 1279695, 1239631, 1166642, 1135091, 1098993, 1059645, 1033543, 994300, 986573, 960173, 953314, 914137, 827191, 770080, 662844, 575993, 760437, 761531, 726066, 865057, 887604, 849126, 761230, 679410, 622557, 563565, 484835, 357898, 323304, 295105, 275102, 231157, 194558, 152847, 123290, 96500, 69596, 51076, 37456, 27559, 18243, 9849];
    allCohorts = [783978, 796374, 802651, 776763, 766631, 739729, 736749, 720613, 738238, 726909, 746345, 741530, 726923, 735760, 751622, 752351, 766517, 787745, 835762, 861102, 891659, 934518, 929523, 916924, 934648, 967092, 985364, 1021919, 1116459, 1102501, 1127589, 1103635, 1083657, 1050793, 1043355, 1045184, 1065675, 1056516, 1060769, 1009272, 995070, 985641, 966513, 941433, 953081, 959668, 1038269, 1140019, 1180738, 1265825, 1323697, 1356220, 1389766, 1391794, 1414471, 1399366, 1351589, 1327937, 1279695, 1239631, 1166642, 1135091, 1098993, 1059645, 1033543, 994300, 986573, 960173, 953314, 914137, 827191, 770080, 662844, 575993, 760437, 761531, 726066, 865057, 887604, 849126, 761230, 679410, 622557, 563565, 484835, 357898, 323304, 295105, 275102, 231157, 194558, 152847, 123290, 96500, 69596, 51076, 37456, 27559, 18243, 9849];

    sickCohorts = [];
    allSickCohorts = [];
    curedCohorts = [];
    deceasedCohorts = [];
    dailyMortality = [];

    totalSick = [];
    totalCured = [];
    totalHealthy = [];
    totalDeceased = [];
    dates = [];

    for(let i=0;i<healthyCohorts.length;i++){
        let sickCohort = [];
        for(let j=0;j<sicknessDuration;j++){
            sickCohort.push(0);
        }
        allSickCohorts.push(0);
        sickCohorts.push(sickCohort);
        curedCohorts.push(0);
        deceasedCohorts.push(0);
    }

    let nSick = initialSick;

    while (nSick > 0){
        const incr = Math.min(Math.max(initialSick/500, 1), nSick);
        const cohort = random(healthyCohorts.length);
        sickCohorts[cohort][0] += incr;
        allSickCohorts[cohort] += incr;
        nSick -= incr;
    }

    updateInfectionRate();

    // we convert this overall mortality to the daily mortality for sick cohorts
    dailyMortality = []
    for(let i=0;i<mortality.length;i++){
        dailyMortality.push(1.0-Math.pow(1.0-mortality[i]/100.0, 1.0/sicknessDuration));
    }
    
}



function random(n){
    return Math.floor(Math.random()*n);
}

function evolve(){
    let newSickCohorts = [];
    let newAllSickCohorts = [];
    let newDeceasedCohorts = [];
    let newCuredCohorts = [];
    let totalSick = 0;
    // first we go through the sick cohorts. For each sick person, we 
    for(let i=0;i<sickCohorts.length;i++){
        let totalDeaths = 0;
        let newSickCohort = [0];
        for(let j=0;j<sickCohorts[i].length;j++){
            const infected = sickCohorts[i][j];
            totalSick += infected
            // we calculate how many people from this cohort will die
            let deaths = Math.floor(dailyMortality[i]*infected);
            // we add the deceased people to the cohorts
            totalDeaths += deaths;
            if (j == sickCohorts[i].length-1){
                // these people made it, they're cured!
                newCuredCohorts.push(curedCohorts[i]+infected-deaths);
            } else {
                // we move all people that did not die one day further
                newSickCohort.push(infected-deaths);
            }
        }
        newSickCohorts.push(newSickCohort);
        // we tally up the deceased
        newDeceasedCohorts.push(totalDeaths+deceasedCohorts[i]);
    }
    // now we calculate how many new infections we will have from this cohort
    let newInfections = Math.ceil(dailyInfectionRate*totalSick);
    let newlyInfectedPeople = 0;
    let increase = Math.ceil(newInfections/500);
    while (newlyInfectedPeople < newInfections) {
        // we randomly pick an age cohort
        let age = random(healthyCohorts.length);
        let healthyPeople = healthyCohorts[age];
        let allPeople = allCohorts[age];
        // only healthy people can be infected, if we assume that the chance of
        // meeting a sick or cured person is the same as meeting a healthy person
        // it means the virality will be proportionally reduced the more such
        // people are present in a given cohort.
        // in the beginning, the immunity will be 0
        let immunity = 1.0-healthyPeople/allPeople;
        // we pick one hundreth of new infections from this cohort
        let newlyInfectedFromCohort = Math.min(Math.ceil(increase*(1.0-immunity)), healthyPeople);
        healthyCohorts[age]-=newlyInfectedFromCohort;
        newSickCohorts[age][0]+=newlyInfectedFromCohort;
        newlyInfectedPeople += increase;
    }
    for(let i=0;i<sickCohorts.length;i++){
        let allSick = 0;
        for(let j=0;j<sickCohorts[i].length;j++){
            allSick +=sickCohorts[i][j];
        }
        newAllSickCohorts.push(allSick);
    }
    allSickCohorts = newAllSickCohorts;
    sickCohorts = newSickCohorts;
    deceasedCohorts = newDeceasedCohorts;
    curedCohorts = newCuredCohorts;
}

function getTotalSick(){
    let totalSick = 0;
    for(let i=0;i<sickCohorts.length;i++){
        for(let j=0;j<sickCohorts[i].length;j++){
            totalSick+=sickCohorts[i][j];
        }
    }
    return totalSick;
}

function getTotalDeceased(){
    let totalDeceased = 0;
    for(let i=0;i<deceasedCohorts.length;i++){
        totalDeceased += deceasedCohorts[i];
    }
    return totalDeceased;
}

function getTotalCured(){
    let totalCured = 0;
    for(let i=0;i<curedCohorts.length;i++){
        totalCured += curedCohorts[i];
    }
    return totalCured;
}

function getTotalHealthy(){
    let totalHealthy = 0;
    for(let i=0;i<healthyCohorts.length;i++){
        totalHealthy += healthyCohorts[i];
    }
    return totalHealthy;
}

function barChart(id, bars, referenceBars, ticks){
    const plot = document.getElementById(id);
    const barMargin = plot.clientWidth > 600 ? 2: 0;
    const bottomMargin = 40;
    const leftMargin = 60;
    const plotHeight = 200;
    const nHorizonalTicks = Math.min(5, bars.length/10);
    const container = document.createElement("div");
    container.style.height = (plotHeight+bottomMargin)+"px";
    container.style.width = "100%";

    if (plot.hasChildNodes())
        plot.replaceChild(container, plot.childNodes[0])
    else
        plot.appendChild(container);

    const plotWidth = container.clientWidth-leftMargin-bars.length*barMargin;
    const barWidth = Math.min(20, plotWidth/bars.length);
    const innerWidth = (barWidth+barMargin)*bars.length;
    let max = 0;
    for(let i=0;i<bars.length;i++){
        if (referenceBars !== undefined && referenceBars[i] > max)
            max = referenceBars[i];
        if (bars[i] > max)
            max = bars[i];
    }
    for(let i=0;i<bars.length;i++){
        let width = barWidth+"px";

        if (referenceBars !== undefined){
            const refElement = document.createElement("span");
            refElement.style.width = width;
            refElement.style.height = Math.floor(referenceBars[i]/max*plotHeight)+"px";
            refElement.style.position = "absolute";
            refElement.style.left = (leftMargin+i*(barWidth+barMargin))+"px";
            refElement.style.bottom = bottomMargin+"px";
            refElement.style.display = "block";
            refElement.className = "refbar";
            refElement.style.margin = barMargin+"px";
            container.appendChild(refElement);
        }
        if ((i) % (Math.floor(bars.length/nHorizonalTicks)) == 0){
            // we add a legend
            const legendElement = document.createElement("span");
            legendElement.style.position = "absolute";
            legendElement.style.display = "block";
            legendElement.innerText = ticks !== undefined ? ticks[i] : i;
            container.appendChild(legendElement);
            legendElement.style.left = (-(legendElement.clientWidth-barWidth)/2+leftMargin+i*(barWidth+barMargin))+"px";
            legendElement.style.bottom = (bottomMargin-legendElement.clientHeight)+"px";
        }

        const element = document.createElement("span");
        element.style.marginLeft = -(barWidth+barMargin)+"px";
        element.style.width = width;
        element.style.height = Math.floor(bars[i]/max*plotHeight)+"px";
        element.style.position = "absolute";
        element.style.left = (leftMargin+i*(barWidth+barMargin))+"px";
        element.style.bottom = bottomMargin+"px";
        element.style.display = "block";
        element.style.zIndex = 2;
        element.className = "bar";
        element.style.margin = barMargin+"px";
        container.appendChild(element);
    }
    const nVerticalTicks = max > 0 ? 5 : 0;
    for(let i=1;i<nVerticalTicks+1;i++){
        const y = i/nVerticalTicks*max;
        const lv = Math.floor(Math.log10(y));
        const v = Math.round(y/Math.pow(10,lv))*Math.pow(10, lv);
        const ly = (bottomMargin+v/max*plotHeight);
        const legendElement = document.createElement("span");
        legendElement.style.position = "absolute";
        legendElement.style.horizontalAnchor = "right";
        legendElement.style.display = "block";
        legendElement.innerText = formatNumber(v);
        container.appendChild(legendElement);

        legendElement.style.left = (leftMargin-legendElement.clientWidth-2)+"px";
        legendElement.style.bottom = ly-legendElement.clientHeight/3+"px";

        const gridElement = document.createElement("span");
        gridElement.style.position = "absolute";
        gridElement.style.display = "inline-block";
        gridElement.style.left = leftMargin;
        gridElement.style.bottom = ly+"px";
        gridElement.style.width = innerWidth+"px";
        gridElement.style.height = "1px";
        gridElement.style.borderTop = "#aaa dashed 1px";
        gridElement.style.zIndex = 1;

        container.appendChild(gridElement);
    }
}

// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function formatNumber(x) {
    const o = Math.floor(Math.log10(x))
    if (o >= 6) {
        return (Math.round(x/Math.pow(10, 6)*10)/10.0)+"M";
    } else if (o >= 3) {
        return (Math.round(x/Math.pow(10, 3)*10)/10.0)+"T";
    }
    return x;
}
function updateNumbers(){

    const totalSickT = getTotalSick();
    const totalHealthyT = getTotalHealthy();
    const totalCuredT = getTotalCured();
    const totalDeceasedT = getTotalDeceased();

    totalSick.push(totalSickT);
    totalHealthy.push(totalHealthyT);
    totalCured.push(totalCuredT);
    totalDeceased.push(totalDeceasedT);
    const d = new Date()
    d.setDate(d.getDate()+t);
    dates.push(d.getDate()+"."+(1+d.getMonth()));

    const totalSickElem = document.getElementById("totalSick");
    totalSickElem.innerText = formatNumber(totalSickT);

    const totalHealthyElem = document.getElementById("totalHealthy");
    totalHealthyElem.innerText = formatNumber(totalHealthyT);

    const totalCuredElem = document.getElementById("totalCured");
    totalCuredElem.innerText = formatNumber(totalCuredT);

    const totalDeceasedElem = document.getElementById("totalDeceased");
    totalDeceasedElem.innerText = formatNumber(totalDeceasedT);

    const dayElem = document.getElementById("day");
    dayElem.innerText = t;
}

function plot(){
    updateNumbers();
    barChart("sick", totalSick, undefined, dates);
    barChart("healthy", totalHealthy, undefined, dates);
    barChart("cured", totalCured, undefined, dates);
    barChart("deceased", totalDeceased, undefined, dates);
    barChart("deceasedCohortsAbsolute", deceasedCohorts);
    barChart("deceasedCohorts", deceasedCohorts, allCohorts);
    barChart("sickCohorts", allSickCohorts, allCohorts);
    barChart("sickCohortsAbsolute", allSickCohorts);
}

function evolveAndPlot(){
    stopped = false;
    if (!paused){
        evolve();
        plot();
        t++;
    }
    if (t < 200)
        setTimeout(evolveAndPlot, 200);
    else
        stopped = true;
}

function onLoad(){
    initialize();
    plot();
    if (stopped)
        evolveAndPlot();
    const pauseButton = document.getElementById("pause");
    pauseButton.addEventListener("click", pause);
    const resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", reset);
    const rateInput = document.getElementById("rate");
    rateInput.value = infectionRate;
    rateInput.addEventListener("input", onRateChange);

    const initialSickInput = document.getElementById("initialSick");
    initialSickInput.value = initialSick;
    initialSickInput.addEventListener("input", onInitialSickChange);

    const sicknessDurtionInput = document.getElementById("sicknessDuration");
    sicknessDurtionInput.value = sicknessDuration;
    sicknessDurtionInput.addEventListener("input", onSicknessDurationChange);

    barChart("mortality", mortality);
}

function reset(){
    initialize();
    plot();
    if (stopped)
        evolveAndPlot();
}

function pause(){
    paused = !paused;
    const pauseButton = document.getElementById("pause");
    if (paused){
        pauseButton.innerHTML = "continue";
        pauseButton.className = "paused";
    }
    else{
        pauseButton.innerHTML = "pause";
        pauseButton.className = "";
    }
}

function onRateChange(e){
    const newInfectionRate = parseFloat(e.target.value);
    if (newInfectionRate === newInfectionRate) {
        infectionRate = newInfectionRate;
        updateInfectionRate();
    }
}

function onSicknessDurationChange(e){
    const newDuration = parseInt(e.target.value);
    if (newDuration === newDuration) {
        sicknessDuration = newDuration;
        reset();
    }
}

function onInitialSickChange(e){
    const newInitialSick = parseInt(e.target.value);
    if (newInitialSick === newInitialSick) {
        initialSick = newInitialSick;
        reset();
    }

}

window.addEventListener("load", onLoad, false);


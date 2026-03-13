let map
let marker
let watchID
let checkTimer

let contact1=""
let contact2=""
let routes=[]
let selectedRoute

let mediaRecorder
let audioChunks=[]

function generateRoutes(){

let r1={
name:"Route A (Fastest)",
coords:[
[16.5062,80.6480],
[16.5080,80.6500],
[16.5100,80.6530]
],
safety:65
}

let r2={
name:"Route B (Safest)",
coords:[
[16.5062,80.6480],
[16.5075,80.6515],
[16.5095,80.6540]
],
safety:85
}

routes=[r1,r2]

selectedRoute=r2

document.getElementById("routeInfo").innerHTML=
`
${r1.name} – Safety ${r1.safety}<br>
${r2.name} – Safety ${r2.safety} ⭐ Recommended
`

document.getElementById("startScreen").classList.add("hidden")
document.getElementById("routeScreen").classList.remove("hidden")

}

function startJourney(){

contact1=document.getElementById("contact1").value
contact2=document.getElementById("contact2").value

let interval=document.getElementById("timer").value

document.getElementById("routeScreen").classList.add("hidden")
document.getElementById("journeyScreen").classList.remove("hidden")

initMap(selectedRoute.coords[0])

drawRoutes()

watchLocation()

checkTimer=setInterval(checkSafety,interval)

}

function checkSafety(){

let reply=prompt("AEGIS Safety Check\nType SAFE")

if(!reply || reply.toLowerCase()!=="safe"){

triggerAlert()

}

}

function initMap(start){

map=L.map('map').setView(start,15)

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{maxZoom:19}).addTo(map)

marker=L.marker(start).addTo(map)

}

function drawRoutes(){

routes.forEach(r=>{

let color=r.safety>80?"green":"red"

L.polyline(r.coords,{color:color}).addTo(map)

})

}

function watchLocation(){

watchID=navigator.geolocation.watchPosition(pos=>{

let lat=pos.coords.latitude
let lon=pos.coords.longitude

marker.setLatLng([lat,lon])

document.getElementById("location").innerHTML=
"📍 "+lat+", "+lon

detectDeviation(lat,lon)

})

}

function detectDeviation(lat,lon){

let safePoint=selectedRoute.coords[1]

let dist=Math.sqrt(
Math.pow(lat-safePoint[0],2)+
Math.pow(lon-safePoint[1],2)
)

if(dist>0.01){

triggerAlert()

}

}

function triggerAlert(){

clearInterval(checkTimer)

document.getElementById("alertScreen").classList.remove("hidden")

}

function reportArea(){

navigator.geolocation.getCurrentPosition(pos=>{

let lat=pos.coords.latitude
let lon=pos.coords.longitude

L.circle([lat,lon],
{radius:100,color:"red"})
.addTo(map)

})

}

function findNearbyPolice(){

navigator.geolocation.getCurrentPosition(pos=>{

let lat=pos.coords.latitude
let lon=pos.coords.longitude

let url=
"https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=police](around:1500,"+lat+","+lon+");out;"

fetch(url)
.then(r=>r.json())
.then(data=>{

data.elements.forEach(p=>{

L.marker([p.lat,p.lon])
.addTo(map)
.bindPopup("🚓 Police Station")

})

})

})

}

function fakeCall(){

alert("📞 Incoming Call: MOM\n'Are you reaching home soon? I'm tracking your location.'")

}

async function startRecording(){

let stream=await navigator.mediaDevices.getUserMedia({audio:true})

mediaRecorder=new MediaRecorder(stream)

mediaRecorder.start()

alert("Recording started")

mediaRecorder.ondataavailable=e=>{
audioChunks.push(e.data)
}

}

function endJourney(){

navigator.geolocation.clearWatch(watchID)

clearInterval(checkTimer)

alert("Journey ended safely")

location.reload()

}
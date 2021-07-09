import React, { useEffect, useState,useRef,usePermissions } from 'react'
import { Svg, G, Circle,Text as TextSvg,Path,Polygon,LinearGradient, Defs,Stop } from 'react-native-svg'
import { StyleSheet } from "react-native";
import { Dimensions,View,Modal,Pressable,Text,Alert,Image,ScrollView,Platform,StatusBar,TouchableOpacity } from 'react-native';
import * as d3scale from 'd3-scale'
import Slider from '@react-native-community/slider';
import chroma from "chroma-js";
import { useFonts } from 'expo-font';
import { createIconSetFromIcoMoon } from '@expo/vector-icons';
import base64 from 'react-native-base64'
import * as FileSystem from 'expo-file-system';
import numeric, { all } from 'numeric'
import AppLoading from 'expo-app-loading';
import { Button } from 'react-native';
import {Calendar} from 'react-native-calendars';
import Tooltip from 'react-native-walkthrough-tooltip';
import { StorageAccessFramework } from 'expo-file-system';
import * as shape from 'd3-shape';
import { Asset } from 'expo-asset';
import Papa from "papaparse";
import RNAndroidInstalledApps from 'react-native-android-installed-apps';
import * as Application from 'expo-application';
import * as Permissions from 'expo-permissions';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import {LocaleConfig} from 'react-native-calendars';

LocaleConfig.locales['pt'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Feb.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['Dom.','Seg.','Ter.','Qua.','Qui.','Sex.','Sab.'],
  today: 'Hoje\'hoje'
};
LocaleConfig.defaultLocale = 'pt';


//IMPORT MANUALLY DATA TO APP
import data from '../assets/samples42.json' //import data from '../assets/samples42.json'
import dataA from '../assets/auxFile1.json' //import data from '../assets/samples42.json'
import dataB from '../assets/auxFile2.json' //import dataB from '../assets/samples4B.json''
import dataC from '../assets/auxFile3.json' //import data from '../assets/samples42.json'
import apps_data from '../assets/apps.json'



var all_samples = [] //save all samples after reading the first time

//Flags to render tooltips only on the first time
var first_time=true
var calendarTip = false
var compareTip = false
var calendarTipFirstTime = true
var compareTipFirstTime = true
var dataset = 0

const d3 = {
  shape,
};

const Icon = createIconSetFromIcoMoon(
    require('../assets/icomoon/selection.json'),
    'IcoMoon',
    'icomoon.ttf'
  );


//Layout variables
MARGIN = 20
PADDING = 30
const GRAPH_MARGIN = 20
const GAP = 30

var auxDates = []


//REMOVE OUTLIERS
var removeOutliers = false

//Auxiliar arrays for detais and for draw points
var points =  []
var aux_ppm = []
var all_details = []
var coordenadas = []
var matrix=[]

var samples_details = {
    sensors : [],
    brightness : 0,
    memory : [],
    cpu_usage : 0,
    point : 0,
    temperature : 0,
    data : " ",
    apps : [],
    sampleID : 0
}


var time = {
    name : "curve",
    timelabels : []
}

function reset_details(){
  samples_details = {
      sensors : [],
      brightness : 0,
      memory : [],
      cpu_usage : 0,
      point : 0,
      temperature : 0,
      data : "",
      apps : [],
      sampleID : 0
  }
}

aux_selected_details = []

var mds_coor = {
  x : 0,
  y :0,
  t : 0,
  path : [],
  displaced : 0
}

function reset_coor(){
  mds_coor = {
      x : 0,
      y :0,
      t : 0,
      path : [],
      displaced : 0
  }
}

//Screen measures
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height-150; //-120

var colorScales = []
colorScales.push([
  // '#fcbba1',
  '#00cc00',
  '#ff3333'
]
)

//scales for mapping points to svg measures
var x = d3scale.scaleLinear().range([MARGIN, windowWidth-PADDING]);
var y = d3scale.scaleLinear().range([MARGIN+GRAPH_MARGIN, windowHeight-PADDING])
var timeScale = d3scale.scaleLinear().range([MARGIN, windowWidth-PADDING])
var colorScale = chroma.scale(colorScales[0]).mode('lab')// chroma.scale(colorScales[i % colorScales.length]).mode('lab')



const coordenadas_mds = []
const initial_coordinates = []

var flag = false //active flag when one period or day is selected
var isPeriod = false 

//boundaries of coordinates and ppm
var min_y = 0
var max_y = 0
var min_x = 0
var max_x = 0
var min_ppm = 0
var max_ppm = 0



//FUNTIONS
function readPeriods(lines,dates){

  all_samples = lines
  let samples = lines
  let aux_ppm = []
  let all_ppm = []



  initial_sample = samples[0]
  initial_battery_level = samples[0].split(";")[4]
  initial_state = samples[0].split(";")[3]

 

  for(i=1;i<samples.length;i++){
      if(Math.abs(samples[i].split(";")[4] - samples[i-1].split(";")[4]) <= 2 && samples[i].split(";")[3]==samples[i-1].split(";")[3]){ //     if(samples[i].split(";")[4] - initial_battery_level >= -2  && samples[i].split(";")[4] - initial_battery_level <=0 && initial_state==samples[i].split(";")[3]){
          //console.log("Sample " + samples[i].split(";")[0] + i)
          aux_ppm.push(samples[i])

      }else{
          if(aux_ppm.length>=10){ //numero de samples por ppm
              if(aux_ppm[0].split(";")[3] == 'Discharging'){
                const sample_timestamp =new Date(aux_ppm[0].split(";")[2].replace(' ', 'T'))
                //filter date 
                if(flag == true){
                  if(dates.length==1){
                    if(String(dates[0].day) == aux_ppm[0].split(";")[2].split("-")[2].split(" ")[0] && String(dates[0].month) == aux_ppm[0].split(";")[2].split("-")[1] && String(dates[0].year) == aux_ppm[0].split(";")[2].split("-")[0]){
                      //console.log("entrei")
                      //all_ppm.push(aux_ppm)
                      all_ppm.push(aux_ppm)
                    } 
                  }else{
                    if(sample_timestamp.getTime() > dates[0].timestamp && sample_timestamp.getTime() < dates[1].timestamp){
                      //console.log("entrei")
                      all_ppm.push(aux_ppm)
                    }
                  }
                   
                }else{
                  all_ppm.push(aux_ppm)
                }
              }
          }
          
            
          //console.log("New bat leve " + samples[i].split(";")[4] + " new state " + samples[i].split(";")[3] + " " + samples[i].split(";")[0])
          initial_battery_level = samples[i].split(";")[4]
          initial_state = samples[i].split(";")[3]
          aux_ppm=[]
          aux_ppm.push(samples[i])
          
      }
  }

  //remove filter
  flag = false
  


  return all_ppm;
}

//function to calculate ppms
function calculate_ppms(periods){

  ppms = []

  for(i=0;i<periods.length;i++){
      ppm = []


      initial_level = periods[i][0].split(";")[4]
      final_level = periods[i][periods[i].length-1].split(";")[4]

      initial_timestamp =new Date(periods[i][0].split(";")[2].replace(' ', 'T'))
      final_timestamp = new Date(periods[i][periods[i].length-1].split(";")[2].replace(' ', 'T'))


      timestamps_diff_min = ((final_timestamp.getTime()-initial_timestamp.getTime())/1000)/60  //colocar aqui tempo absoluto

      aux_ppm = Math.abs((final_level-initial_level))/Math.abs(timestamps_diff_min)
      ppm[0] = aux_ppm
      ppm[1] = periods[i][0].split(";")[2] + ".0"

      if(timestamps_diff_min!=0){ //Periodos que so tem amostras repetidas
          ppms.push(ppm)
      }
          
  }

  
  //Remove outliers
  if(removeOutliers){
      var aux_arr_points = []
      var outliers = []
  
      for(i=0;i<ppms.length;i++){
          aux_arr_points.push(ppms[i][0])
      }
  
      outliers = filterOutliers(aux_arr_points)
  
      for(i=0;i<outliers.length;i++){
          for(j=0;j<ppms.length;j++){
              if(outliers[i] == ppms[j][0]){
                  ppms.splice(j,1)
                  periods.splice(j,1)
              }
          }
          
      }
  
  }

  return [ppms,periods]

}

//function to filter outliers
function filterOutliers(someArray) {

  if(someArray.length < 4)
    return someArray;

  let values, q1, q3, iqr, maxValue, minValue;

  values = someArray.slice().sort( (a, b) => a - b);//copy array fast and sort

  if((values.length / 4) % 1 === 0){//find quartiles
    q1 = 1/2 * (values[(values.length / 4)] + values[(values.length / 4) + 1]);
    q3 = 1/2 * (values[(values.length * (3 / 4))] + values[(values.length * (3 / 4)) + 1]);
  } else {
    q1 = values[Math.floor(values.length / 4 + 1)];
    q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
  }

  iqr = q3 - q1;
  maxValue = q3 + iqr * 1.5;
  minValue = q1 - iqr * 1.5;

  return values.filter((x) => (x < minValue) || (x > maxValue));
}

//function to read sensors from samples
function read_sensors(periods) {
  //roaming_enabled;bluetooth_enabled;location_enabled;power_saver_enabled;nfc_enabled;developer_mode
  for(j=0;j<periods.length;j++){
      for(i=0;i<1;i++){ //mudar para o numero de periodos

          //Save details
          samples_details.sensors.push(periods[j][0].split(";")[28],periods[j][0].split(";")[29],periods[j][0].split(";")[30],periods[j][0].split(";")[31],periods[j][0].split(";")[32],periods[j][0].split(";")[21],periods[j][0].split(";")[23])
          samples_details.brightness = parseInt(parseInt(periods[j][0].split(";")[27])*100/255) //passar da escala de 0 a 255 para 0 a 100
          samples_details.memory.push( periods[j][0].split(";")[7], periods[j][0].split(";")[8], periods[j][0].split(";")[9], periods[j][0].split(";")[10])
          samples_details.cpu_usage = parseFloat(periods[j][0].split(";")[15])*100
          samples_details.data = periods[j][0].split(";")[2]
          samples_details.temperature = periods[j][0].split(";")[14]
          samples_details.sampleID = periods[j][0].split(";")[0]

      }
       all_details.push(samples_details)

       reset_details()
  }

}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


//funtion to calculate mds_coordinates
function mds_classic(matrix,dimensions){
  var M = numeric.mul(-.5, numeric.pow(matrix, 2));

  function mean(A) { return numeric.div(numeric.add.apply(null, A), A.length); }
  var rowMeans = mean(M),
      colMeans = mean(numeric.transpose(M)),
      totalMean = mean(rowMeans);

  for (var i = 0; i < M.length; ++i) {
      for (var j =0; j < M[0].length; ++j) {
          M[i][j] += totalMean - rowMeans[i] - colMeans[j];
      }
  }

  // take the SVD of the double centred matrix, and return the
  // points from it
  var ret = numeric.svd(M),
      eigenValues = numeric.sqrt(ret.S);
  return ret.U.map(function(row) {
      return numeric.mul(row, eigenValues).splice(0, dimensions);
  });

}


//function to read data from samples
async function read_data(dates){

  var lines =  []

    if(first_time==true){
      dataset = getRandomIntInclusive(1,3)
      dataset=3
    }

    if(dataset===1){
      for(i=0;i<dataA.length;i++){
        lines.push(dataA[i]["FIELD1"])
      }
    } else if(dataset===2){
      for(i=0;i<dataB.length;i++){
        lines.push(dataB[i]["FIELD1"])
      }
    } else {
      for(i=0;i<dataC.length;i++){
        lines.push(dataC[i]["FIELD1"])
      }
    }





  // if(first_time==true){
  //   const permissions =  StorageAccessFramework.requestDirectoryPermissionsAsync();
  //   if (permissions.granted) {
  //     // Gets SAF URI from response
  //     const uri = permissions.directoryUri;
      
  //     // Gets all files inside of selected directory
  //     const files =  StorageAccessFramework.readDirectoryAsync(uri);
  //     //alert(`Files inside ${uri}:\n\n${JSON.stringify(files)}`);
  //   }
  // }

  // first_time=false



  // filesArray = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
  // //console.log(filesArray)
  // FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fsamples42.csv",to : FileSystem.documentDirectory+"/test"})
  // // FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fdevicequatro_curves2.curve",to : FileSystem.documentDirectory+"/test"})
  // //FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fsamples4.csv",to : FileSystem.documentDirectory+"/test"})
  // aux_string = await FileSystem.readAsStringAsync(FileSystem.documentDirectory+"/test/"+ "samples42.csv",{encoding:'base64'}) //samples4
  // string = base64.decode(aux_string)


  // lines = string.split("\n")


  var periods = readPeriods(lines,dates);
  console.log(periods.length)
  var values = calculate_ppms(periods)
  
  points = values[0]
  //points.splice(-1,1)
  periods = values[1]
  //periods.splice(-1,1)


  points.sort(function(a, b) {
      var c = new Date(a[1].replace(' ', 'T'));
      var d = new Date(b[1].replace(' ', 'T'));
      return c-d;
  });

  matrix = []
  //Calculo da matriz de semelhança
  for(i=0;i<points.length;i++){
      matrix[i] = []
      var a = new Date(points[i][1].replace(' ', 'T'))
      var t = a.getTime()
      time.timelabels.push(t)
      
      for(j=0;j<points.length;j++){
          if(i==j){
              matrix[i][j] = 0
          }else{
              number = parseFloat(Math.abs(points[i][0]-points[j][0])).toFixed(3)
              matrix[i][j] = parseFloat(number)
          }
      }
  }

  time.timelabels.sort(function(a,b){
      return a-b
  })

  
  var mds = mds_classic(matrix,2)
  for(i=0;i<mds.length;i++){
      t_aux = time.timelabels[i]
      x_aux = mds[i][0]
      y_aux = mds[i][1]


      mds_coor.t = t_aux
      mds_coor.x = x_aux
      mds_coor.y = y_aux
      coordenadas.push(mds_coor)
      reset_coor()
  }

  //console.log(coordenadas)


  read_sensors(periods)

  read_apps()

  all_details.sort(function(a, b) {
      var c = new Date(a.data.replace(' ', 'T'));
      var d = new Date(b.data.replace(' ', 'T'));
      return c-d;
  });


  for(i=0;i<points.length;i++){ //copiar ponto para os detalhes antes de ordenar por data
      all_details[i].point = points[i][0]
  }
  
  //console.log(coordenadas.length + " - " + all_details.length)

  return [coordenadas,all_details]

}


//function to handle slide changes
function slide(value){
  //console.log(value)
  var frac=value
  let i

  var fy = windowHeight - GAP
  var fy_invert = y.invert(fy);

  for(i=0;i<initial_coordinates.length;i++){

    var fx = timeScale(initial_coordinates[i].t);
    var fx_invert = x.invert(fx)

    //console.log(coordenadas_mds[i].x)

    coordenadas_mds[i].x =  initial_coordinates[i].x * (1 - frac) + fx_invert * (frac);
    coordenadas_mds[i].y =  initial_coordinates[i].y * (1 - frac) + fy_invert * (frac);
  }

  calPath()
  removeOverlaps()
  

}


function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function convertColor(rgbString){
  var color = hexToRgb(rgbString)
  var color_result = "rgb("+color.r+","+color.g+"," +color.b+")"
  return color_result;
}


function sensors_info(sampleID){
  let sensors = all_details[sampleID].sensors
  let arr_result = []
  //console.log(all_details)


  let result_sensors = "\n"
  if(sensors[0]==1){
    result_sensors+="Roaming\n"
    arr_result.push(<Image source={require('../assets/bluetooth.png')} fadeDuration={0} style={{ width: 30, height: 30 }}/>)
  }
  if(sensors[1]==1){
    result_sensors+="Bluetooth\n"
    arr_result.push(<Image source={require('../assets/bluetooth.png')} fadeDuration={0} style={{ width: 30, height: 30 }}/>)
  }
  if(sensors[2]==1){
    result_sensors+="Location\n"
    arr_result.push(<Image source={require('../assets/location.png')} fadeDuration={0} style={{ width: 30, height: 30 }}/>)
  }
  if(sensors[3]==1){
    result_sensors+="Power Save Mode\n"
    arr_result.push(<Image source={require('../assets/power-save.png')} fadeDuration={0} style={{ width: 30, height: 30 }}/>)
  }
  if(sensors[4]==1){
    result_sensors+="NFC\n"
    arr_result.push(<Image source={require('../assets/nfc2.png')} fadeDuration={0} style={{ width: 30, height: 30 }}/>)
  }
  if(sensors[5]=="connected"){
    result_sensors+="Mobile Data\n"
    arr_result.push(<Image source={require('../assets/mobiledata.png')} fadeDuration={0} style={{ width: 30, height: 30 }}/>)
  }
  if(sensors[6]=="enabled"){
    result_sensors+="WIFI\n"
    arr_result.push(<Image source={require('../assets/wifi.png')}  fadeDuration={0} style={{ width: 30, height: 30 }}/>)
    
  }
  return arr_result
}


  function aditional_info(sampleID){
    let brightness = all_details[sampleID].brightness
    let memory = all_details[sampleID].memory
    let cpu_usage = all_details[sampleID].cpu_usage
    let point = all_details[sampleID].point
    let data = all_details[sampleID].data
    let temperature = all_details[sampleID].temperature
    let arr_result = []
  
    let result = "\n"


  return  result+= "Taxa de descarga da bateria por minuto : " + (parseFloat(point)).toFixed(3) +"%\n" +
      "Brilho do ecrã : " + brightness +"%\n"
        + "Memória ativa : " + parseInt(memory[0])*0.001 +" Mb\n"
        + "Percentagem do CPU em uso : " +cpu_usage +"%\n"
        +"Temperatura : " + temperature +"ºC\n"
        +"Periodo inicio amostra : " + data +"\n"

}



function getMinY() {

  return coordenadas_mds.reduce((min, p) => p.y < min ? p.y : min, coordenadas_mds[0].y);
}
function getMaxY() {
  return coordenadas_mds.reduce((max, p) => p.y > max ? p.y : max, coordenadas_mds[0].y);
}

function getMinT() {
  return coordenadas_mds.reduce((min, p) => p.t < min ? p.t : min, coordenadas_mds[0].t);
}
function getMaxT() {
  return coordenadas_mds.reduce((max, p) => p.t > max ? p.t : max, coordenadas_mds[0].t);
}

function getMinX() {
  return coordenadas_mds.reduce((min, p) => p.x < min ? p.x : min, coordenadas_mds[0].x);
}
function getMaxX() {
  return coordenadas_mds.reduce((max, p) => p.x > max ? p.x : max, coordenadas_mds[0].x);
}coordenadas_mds

function getMinPPM() {
  return coordenadas_mds.reduce((min, p) => p.ppm < min ? p.ppm : min, coordenadas_mds[0].ppm);
}
function getMaxPPM() {
  return coordenadas_mds.reduce((max, p) => p.ppm > max ? p.ppm : max, coordenadas_mds[0].ppm);
}

function opacity(compare,index){
  //console.log(index)
  if(compare==true){
    if(coordenadas_mds[index].selected==true){
      return 1
    }else{
      return 0.25
    }
    
  }else{
    return 1
  }
}


function handleComparePoint(compare,index){
  if(compare==true){
    if(coordenadas_mds[index].selected==false){
      coordenadas_mds[index].selected=true
      aux_selected_details.push(all_details[index])
    }else{
      coordenadas_mds[index].selected=false
    }
      
  }
}

function reset_coordinates_opacity(){
  aux_selected_details=[]
  for(i=0;i< coordenadas_mds.length;i++){
    coordenadas_mds[i].selected=false
  }
}

async function read_apps(){
      // FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fapps.csv",to : FileSystem.documentDirectory+"/test"})
      // aux_string = await FileSystem.readAsStringAsync(FileSystem.documentDirectory+"/test/"+ "apps.csv",{encoding:'base64'})  //devicequatro_curves_all_periods.curve
      // string = base64.decode(aux_string)
      // apps = string.split("\n")


      var apps =  []
      for(i=0;i<apps_data.length;i++){
        apps.push(apps_data[i]["FIELD1"])
      }
  
      for(j=0;j<all_details.length;j++){
          for(i=0;i<apps.length;i++){
              if(all_details[j].sampleID==apps[i].split(";")[1]){
                  if(apps[i].split(";")[4]==0){
                    if(apps[i].split(";")[3]!="NULL"){
                      all_details[j].apps.push(apps[i].split(";")[3])
                    }else{
                      var splitted_var = apps[i].split(";")[2].split(".")
                      var auxAppName = splitted_var[splitted_var.length-1]
                      all_details[j].apps.push(auxAppName)
                    }
                      
                  }
              }
          }   
     }
}

function calPath(){
  var cPrev = []
  var cSucc = []
  var c1, c2;
  var p2, p2, p;
  var v13, v12, v23;
  var l13, l12;
  var v, l, v1, v2

  var SMOOTH = .3; // smoothing the curve
  var a
  var m = 1;
  cSucc.push([coordenadas_mds[0].x, coordenadas_mds[0].y])
  // for every node pair, calculate helper points to draw curve. (see paper for more information)
  for (var i = 1; i < coordenadas_mds.length - 1; i++) {
      p2 = coordenadas_mds[i];
      l12 = 0
      l23 = 0
      m = 1;

      p1 = coordenadas_mds[i - m];
      v12 = [p2.x - p1.x, p2.y - p1.y]
      l12 = Math.sqrt(v12[0] * v12[0] + v12[1] * v12[1])
      p3 = coordenadas_mds[i + m];
      v23 = [p3.x - p2.x, p3.y - p2.y]
      l23 = Math.sqrt(v23[0] * v23[0] + v23[1] * v23[1])

      c1 = null
      c2 = null
      if (l12 == 0)
          c1 = [p2.x, p2.y]
      if (l23 == 0)
          c2 = [p2.x, p2.y]

      if (l12 > 0 || l23 > 0) {
          while (l12 == 0 && (i - m) > 0) {
              m += 1;
              p1 = coordenadas_mds[i - m];
              v12 = [p2.x - p1.x, p2.y - p1.y]
              l12 = Math.sqrt(v12[0] * v12[0] + v12[1] * v12[1])
          }

          m = 1
          while (l23 == 0 && (i + m) < coordenadas_mds.length - 1) {
              m += 1;
              p3 = coordenadas_mds[i + m];
              v23 = [p3.x - p2.x, p3.y - p2.y]
              l23 = Math.sqrt(v23[0] * v23[0] + v23[1] * v23[1])
          }

          v13 = [p3.x - p1.x, p3.y - p1.y]
          l13 = Math.sqrt(v13[0] * v13[0] + v13[1] * v13[1])

          v = [v13[0], v13[1]];
          if (l13 == 0) {
              v[0] = v12[1] * Math.random()
              v[1] = -v12[0] * Math.random()
          }
          l = Math.sqrt(v[0] * v[0] + v[1] * v[1])

          v1 = [0, 0]
          v1[0] = v[0] / l
          v1[1] = v[1] / l
          v1[0] *= l12 * SMOOTH;
          v1[1] *= l12 * SMOOTH;
        
          v2 = [0, 0]
          v2[0] = v[0] / l
          v2[1] = v[1] / l
          v2[0] *= l23 * SMOOTH;
          v2[1] *= l23 * SMOOTH;
          if (!c1)
              c1 = [p2.x - v1[0], p2.y - v1[1]]
          if (!c2)
              c2 = [p2.x + v2[0], p2.y + v2[1]]
      } else {
          // console.log('no segment')
      }

      cPrev.push(c1)
      cSucc.push(c2)
  }

  // add last node, since last node does not has segment.
  cPrev.push([coordenadas_mds[coordenadas_mds.length - 1].x, coordenadas_mds[coordenadas_mds.length - 1].y])


  var p;
  for (var i = 0; i < coordenadas_mds.length - 1; i++) {
      p1 = coordenadas_mds[i];
      p2 = coordenadas_mds[i + 1];
      p1.path = [
          [p1.x, p1.y],
          [cSucc[i][0], cSucc[i][1]],
          [cPrev[i][0], cPrev[i][1]],
          [p2.x, p2.y]
      ];
  }

}

function startMark(){
  const start_x = x(coordenadas_mds[0].x)
  const start_y = y(coordenadas_mds[0].y)


  var result = String(start_x-15) + "," + String(start_y-5) + " " + String(start_x-15) + "," + String(start_y+5) + " " + String(start_x) + "," + String(start_y)

  return result
}


function removeOverlaps(){
        var dx, dy, dd, xx, yy;
        var overlaps = 1;
        var l;
        var count = 0;
        var dm;
        var MIN_DIST = 8; // minimal distance between points
 
        for (var i = 0; i < coordenadas_mds.length - 1; i++)
            coordenadas_mds[i].displaced = 0;

        var n1, n2;
        while (overlaps > 0 && count < 400) {
            overlaps = 0;
            for (var i = 0; i < coordenadas_mds.length - 1; i++) {
                for (var j = i + 1; j < coordenadas_mds.length; j++) {
                    var dx = x(coordenadas_mds[i].x) - x(coordenadas_mds[j].x);
                    var dy = y(coordenadas_mds[i].y) - y(coordenadas_mds[j].y);
                    var dd = Math.sqrt(dx * dx + dy * dy);
                    if (dd < MIN_DIST && dd > 1) {
                        overlaps++;
                        //console.log("removing overlap")
                        // remove overlap
                        l = (MIN_DIST - dd) / 4;
                        xx = l * (dx / dd);
                        yy = l * (dy / dd);
                        coordenadas_mds[i].x = x.invert(x(coordenadas_mds[i].x) + xx);
                        coordenadas_mds[i].y = y.invert(y(coordenadas_mds[i].y) + yy);
                        coordenadas_mds[j].x = x.invert(x(coordenadas_mds[j].x) - xx);
                        coordenadas_mds[j].y = y.invert(y(coordenadas_mds[j].y) - yy);
                        coordenadas_mds[i].displaced = 1;
                        coordenadas_mds[j].displaced = 1;
                    }
                }
            }
            count++;
        }

        //console.log("Overlaps" + overlaps)
}

function verify_samples(dates,aux_flag){

  //console.log(dates)

  let aux_ppm = []
  let all_ppm = []


  initial_sample = all_samples[0]
  initial_battery_level = all_samples[0].split(";")[4]
  initial_state = all_samples[0].split(";")[3]

 

  for(i=1;i<all_samples.length;i++){
      if(Math.abs(all_samples[i].split(";")[4] - all_samples[i-1].split(";")[4]) <= 2 && all_samples[i].split(";")[3]==all_samples[i-1].split(";")[3]){ //     if(samples[i].split(";")[4] - initial_battery_level >= -2  && samples[i].split(";")[4] - initial_battery_level <=0 && initial_state==samples[i].split(";")[3]){
          //console.log("Sample " + all_samples[i].split(";")[0] + i)
          aux_ppm.push(all_samples[i])

      }else{
          if(aux_ppm.length>=10){ //numero de samples por ppm
              if(aux_ppm[0].split(";")[3] == 'Discharging'){
                const sample_timestamp =new Date(aux_ppm[0].split(";")[2].replace(' ', 'T'))
                //filter date 
                if(aux_flag == true){
                  if(dates.length==1){
                    if(String(dates[0].day) == aux_ppm[0].split(";")[2].split("-")[2].split(" ")[0] && String(dates[0].month) == aux_ppm[0].split(";")[2].split("-")[1] && String(dates[0].year) == aux_ppm[0].split(";")[2].split("-")[0]){
                      //console.log("entrei")
                      //all_ppm.push(aux_ppm)
                      all_ppm.push(aux_ppm)
                    } 
                  }else{
                    if(sample_timestamp.getTime() > dates[0].timestamp && sample_timestamp.getTime() < dates[1].timestamp){
                      //console.log("entrei")
                      all_ppm.push(aux_ppm)
                    }
                  }
                   
                }else{
                  all_ppm.push(aux_ppm)
                }
              }
          }
          
            
          //console.log("New bat leve " + samples[i].split(";")[4] + " new state " + samples[i].split(";")[3] + " " + samples[i].split(";")[0])
          initial_battery_level = all_samples[i].split(";")[4]
          initial_state = all_samples[i].split(";")[3]
          aux_ppm=[]
          aux_ppm.push(all_samples[i])
          
      }
  }
  return all_ppm.length
}


function markPeriodDates(initial_string,final_string){
  let initialDay = initial_string.split("-")[2]
  let initialMonth = initial_string.split("-")[1]
  let initialYear = initial_string.split("-")[0]

  let finalDay = final_string.split("-")[2]
  let finalMonth = final_string.split("-")[1]
  let finalYear = final_string.split("-")[0]



  if(finalYear==initialYear){
    if(initialMonth==finalMonth){
      var list = [];
        for (var i = parseInt(initialDay) + 1; i < parseInt(finalDay); i++) {
          list.push(i);
        }
    }
  }

  console.log(list)

}



// Returns an array of dates between the two dates
var getDates = function(startDate, endDate) {
  var dates = [],
      currentDate = startDate,
      addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
      };
  while (currentDate <= endDate) {
    dates.push(currentDate);
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
};



export default Plot = (props) => {


  const [count, setCount] = useState(0); //tornar a ler novos dados
  const [modalVisible, setModalVisible] = useState(false); //apresentar info popup
  const [selectedSample, setSelectedSample] = useState(0); //amostra selecionada no momento
  const [fontsLoaded] = useFonts({ IcoMoon: require('../assets/icomoon/fonts/icomoon.ttf') });
  const [posts, setPosts] = useState(null); //esperar que os dados carreguem para os arrays
  var [auxState,setAuxState] = useState(false) //se o calendario aparece ou não
  const [dates,setDates] = useState([]) //dia ativo no momento
  const [compare,setCompare] = useState(false) //transparencia nos botoes a comparar
  const [showTip, setTip] = useState(false);

  const [showInitialTips,setInitialTips] = useState(false)
  const [showInitialTips2,setInitialTips2] = useState(false)
  const [renderButtons,setRenderButtons] = useState(true)
  const [sliderValue,setSliderValue] = useState(1)
  const [markDates,setMarkedDates] = useState({})
  const [showCalendarTip, setCalendarTip] = useState(false);
  const [showSecondTip, setSecondTip] = useState(false);




  useEffect(()=> {
    async function read_dados(){
      console.log("Read New Data")

      coordenadas=[]
      all_details=[]   
      auxDates = []
      time.timelabels = []

      var results  =  await read_data(dates)


      coordenadas_mds.splice(0,coordenadas_mds.length)
      initial_coordinates.splice(0,initial_coordinates.length)
      
        for(i=0;i<coordenadas.length;i++){ 
          coordenadas_mds.push({
            x : coordenadas[i].x,
            y : coordenadas[i].y,
            t : coordenadas[i].t,
            ppm : all_details[i].point,
            selected : false
          })
  
          //aux array for initial coordinates
          initial_coordinates.push({
            x : coordenadas[i].x,
            y : coordenadas[i].y,
            t : coordenadas[i].t,
            ppm : all_details[i].point,
            selected : false
          })
        }
  
        min_x = getMinX()
        max_x = getMaxX()
        min_y = getMinY()
        max_y = getMaxY()
        min_ppm = getMinPPM()
        max_ppm = getMaxPPM()
        min_t = getMinT()
        max_t = getMaxT()


        x.domain([min_x,max_x])
        y.domain([min_y,max_y])
        timeScale.domain([min_t,max_t])
        colorScale.domain([min_ppm,max_ppm])
        
        //set data on axis
        auxDates.push(all_details[0].data)
        auxDates.push(all_details[all_details.length-1].data)


        calPath() //calculate helper points to draw curve
        removeOverlaps() //remove overlaps

        //reset ás datas dos filtros
        setDates([])

        //para começar com a visão temporal
        slide(1)
        //re-render component
        setPosts(results)

    }
    setPosts(null)
    read_dados()


  },[count])


  if(posts===null){
    console.log("NOT LOADED YET")
    return null;
  }


  var curveFunction = d3.shape.line()
          .x(function(d) {
              return x(d[0]);
          })
          .y(function(d) {
              return y(d[1]);
          })
          .curve(d3.shape.curveBasis);


        

  if (!fontsLoaded) {    
    return <AppLoading />;
  }else{
      return (
        
        <View style={{backgroundColor:"#E5F5E4"}}>

          <View style={styles.centeredView}>
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                Alert.alert("Modal has been closed.");
                setModalVisible(!modalVisible);
              }}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>

                  <Text style={styles.modalText}>Sensores ativos : </Text>
                  {sensors_info(selectedSample).map((item,i) => (
                      <View key={i}>{item}</View>
                    ) 
                  )}

                  <Text style={styles.modalText}>{aditional_info(selectedSample)}</Text>


                  <Pressable
                    style={styles.button2}
                    onPress={() => setModalVisible(!modalVisible)}
                  >
                    <Text>Fechar</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>


          </View>

          <Svg width={windowWidth} height={windowHeight}   style={styles.svg} >

            <G>
            {coordenadas_mds.map(
              (coor, i) => 
                <Circle
                  onPress={() => {
                    
                      handleComparePoint(compare,i)
                      setSelectedSample(i) //change "active sample to display info"
                      if(compare==false){
                        setModalVisible(true) 
                      }  
                    }
                  }
                  cx={x(coor.x)}
                  cy={y(coor.y)}
                  r="8" 
                  fill= {convertColor(colorScale(coordenadas_mds[i].ppm))}
                  fillOpacity={opacity(compare,i)}
                  key={i}     
              />    
              )}
            </G>  

            <G>
              {sliderValue == 1 ? auxDates.map(
                (coor, i) => 
                  <TextSvg
                    fill="#000000"
                    x={i*windowWidth-(50*i) - (75*i)}
                    y={windowHeight}
                    style={styles.styleText}
                    font={`12px Arial`}
                    key={i}
                    >
                    {auxDates[i].split(" ")[1] + "\n" + auxDates[i].split(" ")[0] }
                    
                  </TextSvg>
              ) : null}
              
            </G>

            <G>
              {coordenadas_mds.map(
                (coor, i) => {
                  if(i < coordenadas_mds.length-1){
                    return <Path d={curveFunction(coordenadas_mds[i].path)} fill="transparent" stroke="#000000" strokeWidth={0.5} key={i} />
                  }else{
                    return null
                  }
                }
                 
                )}
            </G>

            <G>
              <Polygon
                points={startMark()}
                fill="lime"
                stroke="purple"
                strokeWidth="1"
              />
            </G>

          </Svg>
          
          <Tooltip
              isVisible={first_time}
              content={
                <View >
                  <Text> Arrastar o slider para a esquerda para agrupar os períodos. </Text>
                </View>
              }
              arrowSize={{ width: 16, height: 8 }}
              onClose={() => {
                setTip(false)
                first_time=false;
                setInitialTips(true)
                }
              }
              placement={"center"}
              displayInsets={{ top: 0,left: windowWidth/2-150,bottom: 75}}
              // below is for the status bar of react navigation bar
               topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
            >
              <View></View>
          </Tooltip>

          <Tooltip
              isVisible={showInitialTips}
              content={
                <View >
                  <Text> "Calendário" para selecionar um dia especifico. </Text>
                </View>
              }
              displayInsets={{ top: 0,left: 0}}
              placement={'center'}
              onClose={() => {
                  setInitialTips(false)
                  setInitialTips2(true)
                }
              }
              // below is for the status bar of react navigation bar
               topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
            >
              <View></View>
          </Tooltip>

          <Tooltip
              isVisible={showInitialTips2}
              content={
                <View >
                  <Text> "Comparar" para selecionar períodos a serem analisados. </Text>
                </View>
              }
              placement={'center'}
              onClose={() => {
                
                setInitialTips2(false)
              }}
              // below is for the status bar of react navigation bar
               topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
            >
              <View></View>
          </Tooltip>


          <Tooltip
              isVisible={calendarTip}
              content={
                <View >
                  <Text> Selecione o dia a ser analisado. Para escolher um período selecione o dia inicial e o final. </Text>
                </View>
              }
              onClose={() =>{
                calendarTip = false
                calendarTipFirstTime = false
                setCalendarTip(!showCalendarTip)}
              } 
              // below is for the status bar of react navigation bar
               topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
            >
              <View></View>
          </Tooltip>

          <Tooltip
              isVisible={compareTip}
              content={
                <View >
                  <Text> Selecione os períodos a analisar para analisar detalhes dos periodos selecionados. </Text>
                </View>
              }
              onClose={() => {
                compareTip=false
                compareTipFirstTime = false
                setSecondTip(!showSecondTip)
              }}
              // below is for the status bar of react navigation bar
               topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
            >
              <View></View>
          </Tooltip>



            <Slider
                value={1}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                width={windowWidth}
                onValueChange={(value) => {
                    slide(value)
                    setSliderValue(value)
                    //setCount(count+1)
                  }
                }
              >
            </Slider>

              
              <View style={styles.button_containter}>

                {renderButtons ? <TouchableOpacity style={styles.button2}
                                    onPress={()=>{
                                      setAuxState(true)
                                      if(calendarTipFirstTime==true){
                                        calendarTip = true
                                      }
                                      calendarTipFirstTime = false
                                      }
                                    }
                                  >
                                    <Text style={{fontWeight:"bold"}}>Calendário</Text>
                                  </TouchableOpacity> : null}
                


                <TouchableOpacity style={styles.button2}
                  
                    onPress={() => {
                      if(compare==true){
                        if(aux_selected_details.length!=0){
                          setSelectedSample(0)
                          props.navigation.navigate("TableInfo",{state : aux_selected_details})    
                          setCompare(false)
                          setRenderButtons(true)
                          reset_coordinates_opacity()
                        }else{
                          Alert.alert("Selecione pelo menos um período!")
                        }
                        
                        
                      }else{
                        setSelectedSample(0)
                        props.navigation.navigate("TableInfo",{state : all_details}) 
                      }                          
                      }
                    }
                >
                  <Text style={{fontWeight:"bold"}}>Analisar detalhes</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.button2}                    
                  onPress={() => {
                      if(compareTipFirstTime==true){
                        compareTip=true
                      }     
                      compareTipFirstTime=false

                      setCompare(true)    
                      setRenderButtons(false)          
                      if(compare==true){
                        aux_selected_details = []
                        setCompare(false)
                        setRenderButtons(true)
                      }
                    }
                  }
                >
                  {compare==false ? <Text style={{fontWeight:"bold"}}>Comparar</Text> :  <Text>Fechar</Text>}
                </TouchableOpacity>
                <Text>{dataset}</Text>




              </View>


              {auxState ? <View style={styles.calendar}>
                <ScrollView>
                    <Calendar 
                    markingType={'period'}
                    markedDates={markDates}

                      onDayPress={(day) => { 

                        if(dates.length>=2){
                          Alert.alert("Dia ou período já selecionado. Clique na opção 'Limpar' para selecionar outro dia ou período.")
                        }else{
                          let aux_array = dates
                          aux_array.push(day)
                          setDates(aux_array)
                          var obj = {}

                          if(dates.length==1){
                            let string = dates[0].dateString   
                                               
                            obj[string] = {
                              marked: true, dotColor: '#50cebb'
                            }
                          } else{
                            let initial_string = dates[0].dateString
                            let final_string = dates[1].dateString

                            //markPeriodDates(initial_string,final_string)
                            var datas = getDates(new Date(initial_string), new Date(final_string)); 
                            datas.forEach(function(date) {
                              obj[date.toISOString().substring(0, 10)] = {color: '#70d7c7'}
                            });

                            obj[initial_string] = {
                              startingDay: true, color: '#50cebb'
                            }

                            obj[final_string] = {
                              endingDay: true, color: '#50cebb'
                            }
                          }
                          setMarkedDates(obj) 
                        }
                      }
                          
                      }
                      current={'2017-12-22'}
                      >
                    </Calendar>
                </ScrollView>

                <View style={styles.button_containter}>

                  <Pressable
                    style={styles.button2}
                    onPress={()=>{
                      if(dates.length==0){
                        Alert.alert("Selecione pelo menos um dia! Para selecionar um período selecione dois dias!")
                      }else{
                        const size = verify_samples(dates,true) //verify if exists samples
                        if(size>1){
                          if(dates.length==0){
                            setAuxState(false)
                          }else{
                            //RESETS of all variables  
                            setMarkedDates({})  
                            setAuxState(false) 
                            flag = true
                            setSelectedSample(0)
                            setSliderValue(1)
                            setCount(count+1)  
                          }
                        }else{
                          setDates([])
                          setMarkedDates({})   
                          Alert.alert("Não existem amostras para o período selecionado. Selecione outro período!")
                        }
                      }
                    
                    }}
                  >
                    <Text style={styles.textStyle}>Submeter</Text>
                  </Pressable>

                  <Pressable
                    style={styles.button2}
                    onPress={()=>{
                      Alert.alert("Seleção limpa. Escolha um novo período!")
                      setDates([])  
                      setMarkedDates({})                                  
                      }
                    }
                  >
                    <Text style={styles.textStyle}>Limpar</Text>
                  </Pressable>


                  <Pressable
                    style={styles.button2}
                    onPress={()=>{
                      setAuxState(false) 
                      flag = false
                      setSelectedSample(0)
                      setSliderValue(1)
                      setCount(count+1)   
                      setDates([])                                
                      }
                    }
                  >
                    <Text style={styles.textStyle}>Geral</Text>
                  </Pressable>

                </View>
                                   
              </View> : null}


      </View>
      )
    }

}

//STYLING
const styles = StyleSheet.create({
  styleText : {
    position:'absolute',
  },
  button2 : {
    alignItems: "center",
    backgroundColor: "#AECDAC",
    padding: 10,
    borderRadius:20
  },
  button_containter : {
    flexDirection:'row',
    justifyContent:'center'
  },
  calendar : {
    position:'absolute',
    width:wp('35%'),
    height:windowHeight,
    left:windowWidth/2-wp('35%')/2,
  },
  svg : {
    backgroundColor: "#E5F5E4",
    
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  
  },
  modalView: {
    margin: 20,
    backgroundColor : "#E5F0E5",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "black",
    textAlign: "center",
    fontWeight:"bold"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontStyle: 'italic',
    fontWeight: 'bold'
  }
});


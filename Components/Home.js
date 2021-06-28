import { StatusBar } from 'expo-status-bar';
import React,{useState,useEffect} from 'react';
import { StyleSheet, Text, View ,Button,ScrollView} from 'react-native';
import Slider from '@react-native-community/slider';
import base64 from 'react-native-base64'
import * as FileSystem from 'expo-file-system';
import { AsyncStorage } from 'react-native';
import FileViewer from "react-native-file-viewer";
import * as MediaLibrary from 'expo-media-library';
import { StorageAccessFramework } from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import { parse } from 'react-native-svg';
import numeric from 'numeric'
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import { createIconSetFromIcoMoon } from '@expo/vector-icons';

import {Calendar, CalendarList, Agenda} from 'react-native-calendars';


const Icon = createIconSetFromIcoMoon(
    require('../assets/icomoon/selection.json'),
    'IcoMoon',
    'icomoon.ttf'
  );


var removeOutliers = true
var points =  []
var aux_ppm = []


const styles = StyleSheet.create({
    main_view : {
      backgroundColor: "#eaeaea",
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    modalView: {
        backgroundColor: "white",
        alignItems: "center",

      },
      centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
});

var all_details = []
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


var matrix=[]

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


var coordenadas = []
var mds_coor = {
    x : 0,
    y :0,
    t : 0
}

function reset_coor(){
    mds_coor = {
        x : 0,
        y :0,
        t : 0
    }
}



function readPeriods(lines){

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
                    all_ppm.push(aux_ppm)
                }
            }

            //console.log("New bat leve " + samples[i].split(";")[4] + " new state " + samples[i].split(";")[3] + " " + samples[i].split(";")[0])
            initial_battery_level = samples[i].split(";")[4]
            initial_state = samples[i].split(";")[3]
            aux_ppm=[]
            aux_ppm.push(samples[i])
            
        }
    }
    //print_periods(all_ppm)


    return all_ppm;
}

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

  function read_sensors(periods) {
    //roaming_enabled;bluetooth_enabled;location_enabled;power_saver_enabled;nfc_enabled;developer_mode
    for(j=0;j<periods.length;j++){
        for(i=0;i<1;i++){ //mudar para o numero de periodos

            //Save details
            samples_details.sensors.push(periods[j][0].split(";")[28],periods[j][0].split(";")[29],periods[j][0].split(";")[30],periods[j][0].split(";")[31],periods[j][0].split(";")[32],periods[j][0].split(";")[21],periods[j][0].split(";")[23])
            samples_details.brightness = periods[j][0].split(";")[27]
            samples_details.memory.push( periods[j][0].split(";")[7], periods[j][0].split(";")[8], periods[j][0].split(";")[9], periods[j][0].split(";")[10])
            samples_details.cpu_usage = periods[j][0].split(";")[14]
            samples_details.data = periods[j][0].split(";")[2]
            samples_details.temperature = periods[j][0].split(";")[14]
            samples_details.sampleID = periods[j][0].split(";")[0]

        }
         all_details.push(samples_details)

         reset_details()
    }
 
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


  async function read_data(){

    filesArray = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory+"/test");
    console.log(filesArray)
    // FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fsamples42.csv",to : FileSystem.documentDirectory+"/test"})
    // FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fdevicequatro_curves2.curve",to : FileSystem.documentDirectory+"/test"})
    //FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fsamples4.csv",to : FileSystem.documentDirectory+"/test"})
    aux_string = await FileSystem.readAsStringAsync(FileSystem.documentDirectory+"/test/"+ "samples4.csv",{encoding:'base64'}) //samples4
    string = base64.decode(aux_string)

    //console.log(string)
    lines = string.split("\n")

    var periods = readPeriods(lines);
    var values = calculate_ppms(periods)

    points = values[0]
    points.splice(-1,1)
    periods = values[1]
    periods.splice(-1,1)

    
    points.sort(function(a, b) {
        var c = new Date(a[1].replace(' ', 'T'));
        var d = new Date(b[1].replace(' ', 'T'));
        return c-d;
    });


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
        t = time.timelabels[i]
        x = mds[i][0]
        y = mds[i][1]


        mds_coor.t = t
        mds_coor.x = x
        mds_coor.y = y
        coordenadas.push(mds_coor)
        reset_coor()
    }

    //console.log(coordenadas)


    read_sensors(periods)

    all_details.sort(function(a, b) {
        var c = new Date(a.data.replace(' ', 'T'));
        var d = new Date(b.data.replace(' ', 'T'));
        return c-d;
    });


    for(i=0;i<points.length;i++){ //copiar ponto para os detalhes antes de ordenar por data
        all_details[i].point = points[i][0]
    }


    //console.log(all_details)

}



async function read_points(){
    //FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fdevicequatro_curves_all_periods.curve",to : FileSystem.documentDirectory+"/test"})
    aux_string = await FileSystem.readAsStringAsync(FileSystem.documentDirectory+"/test/"+ "devicequatro_curves2.curve",{encoding:'base64'})  //devicequatro_curves_all_periods.curve
    string = base64.decode(aux_string)
    //console.log(string)

    nodes = string.split("n")


    for(i=2;i<nodes.length;i++){
        arr = nodes[i].split(",")
        //console.log(arr)
        t = arr[1].split(":")[1]
        x = arr[3].split(":")[1]
        y = arr[4].split(":")[1]

        mds_coor.t = parseFloat(t)
        mds_coor.x = parseFloat(x)
        mds_coor.y = parseFloat(y)
        coordenadas.push(mds_coor)
        reset_coor()

    }

}

async function read_apps(state){
    FileSystem.copyAsync({from : "content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Fapps.csv",to : FileSystem.documentDirectory+"/test"})
    aux_string = await FileSystem.readAsStringAsync(FileSystem.documentDirectory+"/test/"+ "apps.csv",{encoding:'base64'})  //devicequatro_curves_all_periods.curve
    string = base64.decode(aux_string)
    apps = string.split("\n")


    for(j=0;j<all_details.length;j++){
        for(i=0;i<apps.length;i++){
            if(all_details[j].sampleID==apps[i].split(";")[1]){
                if(apps[i].split(";")[4]==0){
                    all_details[j].apps.push(apps[i].split(";")[3])
                }
            }
        }   
    }
    


    
}


export default Home = (props) => {

    var [state,setState] = useState(all_details)
    var [coorState,setCoorState] = useState(coordenadas)
    const [fontsLoaded] = useFonts({ IcoMoon: require('../assets/icomoon/fonts/icomoon.ttf') });

    var [auxState,setAuxState] = useState(false)





    useEffect(() =>{
        read_data() //ler dados e sensores, etc
        //read_points() //ler coordeandas da curva de similaridade
        
    },[]) 

    read_apps(state)

    if (!fontsLoaded) {
        return <AppLoading />;
      }else{
            return(
                <View style={styles.main_view}>
                    <View >
                        <Button style={styles.button}
                            title="Time-curve"
                            onPress={() =>
                                props.navigation.navigate("Analysis",{state : state,coorState : coorState})
                            }
                        />

                        <Button style={styles.Button}
                            title="Settings analyze"
                            onPress={() => 
                                props.navigation.navigate("SampleAnalysis",{state : state})}
                        />

                        <Button style={styles.Button}
                            title="Table"
                            onPress={() => 
                                props.navigation.navigate("TableInfo",{state : state})}
                        />

                    </View>

                    <Button style={styles.Button}
                            title="Calendar"
                            onPress={()=>setAuxState(true)}
                    />

                    {auxState ? <View style={styles.centeredView}>
                                    <ScrollView>
                                        <Calendar style={{
                                            borderWidth: 1,
                                            borderColor: 'gray',
                                        
                                        }}>
                                        </Calendar>
                                    </ScrollView>
                                </View> : null}
                </View>
            
            )
                }
    
}
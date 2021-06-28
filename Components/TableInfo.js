import React, { useState } from 'react'
import { CheckBox } from 'react-native-elements';
import { Dimensions,View,Modal,Pressable,Text,Alert,Image, StyleSheet, ScrollView, TouchableOpacity ,Switch,Button, ImageBackground } from 'react-native';
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
import chroma from "chroma-js";
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import { createIconSetFromIcoMoon } from '@expo/vector-icons';
import Tooltip from 'react-native-walkthrough-tooltip';
import { Platform,StatusBar} from 'react-native';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';


var firstTime = true


const Icon = createIconSetFromIcoMoon(
    require('../assets/icomoon/selection.json'),
    'IcoMoon',
    'icomoon.ttf'
  );


//function about colors
var colorScales = []
colorScales.push([
  // '#fcbba1',
  '#00cc00',
  '#ff3333'
]
)
var colorScale = chroma.scale(colorScales[0]).mode('lab')// chroma.scale(colorScales[i % colorScales.length]).mode('lab')
function red(index,state) {
    return  colorScale(state[index].point).toString()
}

const aux = [<Image source={require('../assets/insta.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>,<Image source={require('../assets/android.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>,<Image source={require('../assets/bluetooth.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>]


const styles = StyleSheet.create({
    checkboxContainer : {flexDirection: 'row',alignItems:"center",justifyContent:"center", width : Dimensions.get('window').width},
    container: { flex: 1, padding: 16, paddingTop: 30, backgroundColor: '#fff' },
    header: { height: 75, backgroundColor: '#357432' },
    header_sensors : {height: 20, backgroundColor: '#A3B6A2',alignItems:"center",justifyContent:"center"},
    text: { textAlign: 'center', fontWeight: '100' },
    dataWrapper: { marginTop: -1 },
    row: { flexDirection: 'row', backgroundColor: '#E7EDE7',alignItems:"center",justifyContent:"center"},
    btn: { width: 58, height: 18, marginLeft: 15, backgroundColor: '#c8e1ff', borderRadius: 2 },
    btnText: { textAlign: 'center' },
    title: { flex: 1, backgroundColor: '#f6f8fa' },
  });

  function getMinPPM(state) {
    return state.reduce((min, p) => p.point < min ? p.point : min, state[0].point);
  }
  function getMaxPPM(state) {
    return state.reduce((max, p) => p.point > max ? p.point : max, state[0].point);
  }



export default TableInfo = ({route,navigation}) => {

    const [showTip, setTip] = useState(true);
    const [showTip2, setTip2] = useState(false);
    const [showTip3, setTip3] = useState(false);


    const [isEnabled, setIsEnabled] = useState(true);
    const [appsEnabled,setAppsEnabled] = useState(false);
    const [sensorsEnabled,setSensorsEnabled] = useState(false);

    const [sortByTime,setSortByTime] = useState(true)
    const [sortByPPM,setSortByPPM] = useState(false)

    const [ascendingOrder,setAscendingOrder] = useState(true)
    const [descendingOrder,setDescendingOrder] = useState(false)


    const  {state}  = route.params;


    //Sort by time or sort by PPM
    if(sortByPPM){
        if(ascendingOrder==true){
            state.sort((a,b) => parseFloat(a.point) - parseFloat(b.point));
        }else{
            state.sort((a,b) => parseFloat(b.point) - parseFloat(a.point));
        }
        
    } else{
        if(ascendingOrder==true){
            state.sort(function(a, b) {
                var c = new Date(a.data.replace(' ', 'T'));
                var d = new Date(b.data.replace(' ', 'T'));
                return c-d;
            });
        }else{
            state.sort(function(a, b) {
                var c = new Date(a.data.replace(' ', 'T'));
                var d = new Date(b.data.replace(' ', 'T'));
                return d-c;
            });
        }
        
    }


    var state_table = {
        temperature_header : [],
        cpu_header : [],
        memory_header : [],
        brilho_header : [],
        temperature_data : [],
        cpu_data : [],
        brilho_data : [],
        memory_data : [],
        tableData : [],
        widthArr : [],
        heightArr : [],
        sensors_header : [],
        apps_header : [],
        tableData_sensors: [],
        tableData_apps: [],
        tableDataAux : [],
        tableTitle: ['Title'],

    }


    function header(n_ppm,state){ //numero de ppms
        var i

        for(i=0;i<n_ppm;i++){ //colocar n_ppm
            state_table.tableData.push("T.D.B" + "\n" + state[i].point.toFixed(3) + "%" + "\n" + state[i].data)
            state_table.widthArr.push(100)
            state_table.heightArr.push(100)
            state_table.apps_header.push("APPS")
            state_table.sensors_header.push("SENSORS")
            state_table.temperature_header.push(<Image source={require('../assets/temperatura.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
            state_table.brilho_header.push(<Image source={require('../assets/brilho.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
            state_table.cpu_header.push(<Image source={require('../assets/cpu.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
            state_table.memory_header.push(<Image source={require('../assets/memory.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
            state_table.cpu_data.push(state[i].cpu_usage + " %")
            state_table.brilho_data.push(state[i].brightness + " %")
            state_table.memory_data.push(parseInt((state[i].memory[0])*0.001).toFixed(2) + " MBytes")
            state_table.temperature_data.push(state[i].temperature + " ºC")
        }
    }

    header(state.length,state)
    

    var max_ppm = getMaxPPM(state)
    var min_ppm = getMinPPM(state)
    colorScale.domain([min_ppm,max_ppm])

    for(i=0;i<state.length;i++){
        var aux_arr = []
        if(state[i].sensors[0]==1){
            aux_arr.push(<Image source={require('../assets/bluetooth.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
        }
        if(state[i].sensors[1]==1){
            //aux_arr.push("Bluetooth")
            aux_arr.push(<Image source={require('../assets/bluetooth.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
        }
        if(state[i].sensors[2]==1){
            //aux_arr.push("Location")
            aux_arr.push(<Image source={require('../assets/location.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
        }
        if(state[i].sensors[3]==1){
            //aux_arr.push("Power-save")
            aux_arr.push(<Image source={require('../assets/power-save.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
        }
        if(state[i].sensors[4]==1){
            //aux_arr.push("NFC")
            aux_arr.push(<Image source={require('../assets/nfc2.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
        }
        if(state[i].sensors[5]=="connected"){
           // aux_arr.push("Mobile data")
            aux_arr.push(<Image source={require('../assets/mobiledata.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
        }
        if(state[i].sensors[6]=="enabled"){
            aux_arr.push(<Image source={require('../assets/wifi.png')} fadeDuration={0} style={{ width: 20, height: 20 }}/>)
        }

        // console.log(state[i].apps.length)
        // state_table.tableData_apps.push(state[i].apps.length)
        state_table.tableData_apps.push(state[i].apps)
        state_table.tableData_sensors.push(aux_arr)

        
    }

    state_table.tableDataAux.push(aux)

    const [fontsLoaded] = useFonts({ IcoMoon: require('../assets/icomoon/fonts/icomoon.ttf') });
    if (!fontsLoaded) {
        return <AppLoading />;
      }else{
        return(

            <View style={{flex:1,width:Dimensions.get('window').width}}>
                <Tooltip
                    isVisible={showTip3}
                    content={
                        <View >
                        <Text> Ordenar amostras por tempo ou por taxa de descarga da bateria por minuto(T.D.B). </Text>
                        </View>
                    }
                    onClose={() => {
                        setTip3(false)
                        
                        }
                    }
                    placement={"bottom"}
                    //displayInsets={{ top: 0,left: windowWidth/2-150,bottom: 75}}
                    // below is for the status bar of react navigation bar
                    //topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
                >
                    <View></View>
                </Tooltip>
                <View style={styles.checkboxContainer}>

                <View style={{width:wp('6%')}}>
                        <Text style={{textDecorationStyle:'double', fontWeight: 'bold',fontSize :10 }}>Mostrar</Text>
                    </View>

                    <CheckBox
                    
                        containerStyle={{width:wp('15%'),backgroundColor:"#ffb3b3"}}
                        title = "Sensores"
                        size = {wp('1.25%')}
                        textStyle={{fontSize:wp('1.5%')}}
                        checkedIcon='dot-circle-o'
                        uncheckedIcon='circle-o'
                        checked ={sensorsEnabled}
                        onPress={() => {
                            setSensorsEnabled(!sensorsEnabled);
                    }}/>


                    <CheckBox
                        containerStyle={{width:wp('10%'),backgroundColor:"#ffb3b3"}}
                        title="Apps"
                        size = {wp('1.25%')}
                        textStyle={{fontSize:wp('1.5%')}}
                        checkedIcon='dot-circle-o'
                        uncheckedIcon='circle-o'
                        checked={appsEnabled}
                        onPress={() => {
                            setAppsEnabled(!appsEnabled);
                    }}/>

                    <CheckBox
                        containerStyle={{width:wp('12%'),backgroundColor:"#ffb3b3"}}
                        title="Outros"
                        size = {wp('1.25%')}
                        textStyle={{fontSize:wp('1.5%')}}
                        checkedIcon='dot-circle-o'
                        uncheckedIcon='circle-o'
                        checked={isEnabled}
                        onPress={() => {
                            setIsEnabled(!isEnabled);
                    }}/>

                    <View style={{width:wp('6%')}}>
                        <Text style={{textDecorationStyle:'double', fontWeight: 'bold',fontSize :10 }}>Ordenar</Text>
                    </View>
                    
                    
                    <CheckBox
                        containerStyle={{width:wp('12%'),backgroundColor:"#c6ffb3"}}
                        title="Tempo"
                        size = {wp('1.25%')}
                        textStyle={{fontSize:wp('1.5%')}}
                        checked={sortByTime}
                        onPress={() => {
                            setSortByPPM(false)
                            setSortByTime(!sortByTime);
                    }}/>


                
                    <CheckBox
                        containerStyle={{width:wp('10%'),backgroundColor:"#c6ffb3"}}
                        title="T.D.B"
                        size = {wp('1.25%')}
                        textStyle={{fontSize:wp('1.5%')}}
                        checked={sortByPPM}
                        onPress={() => {
                            setSortByTime(false)
                            setSortByPPM(!sortByPPM);
                    }}/>

                    {/* <View style={{flexDirection : 'row', alignContent:'center',alignItems:'center'}}>
                    <Image source={require('../assets/ascending.png')} fadeDuration={0} style={{ width: wp('2.5%'), height: wp('2.5%') }}/>
                        <CheckBox
                            containerStyle={{width:wp('5%'),backgroundColor:"#c6ffb3"}}
                            size = {wp('1.25%')}
                            checked={ascendingOrder}
                            onPress={() => {
                                setDescendingOrder(false)
                                setAscendingOrder(!ascendingOrder)

                        }}/>
                    </View> */}

                    {/* <View style={{flexDirection : 'row', alignContent:'center',alignItems:'center'}}>
                    <Image source={require('../assets/descending.png')} fadeDuration={0} style={{ width: wp('2.5%'), height: wp('2.5%') }}/>
                        <CheckBox
                            containerStyle={{width:wp('5%'),backgroundColor:"#c6ffb3"}}
                            size = {wp('1.25%')}
                            checked={descendingOrder}
                            onPress={() => {
                                setAscendingOrder(false)
                                setDescendingOrder(!descendingOrder)

                        }}/>
                    </View> */}
                    <View style={{ alignContent:'center',alignItems:'center',width: wp('4.5%'), height: wp('4.5%'),backgroundColor:"#c6ffb3"}}>
                        <TouchableOpacity onPress={() => {
                            setDescendingOrder(false)
                            setAscendingOrder(!ascendingOrder)}
                        }>
                            <ImageBackground source={require("../assets/ascending2.png")} style={{width: wp('4.5%'), height: wp('4.5%')}}>

                            </ImageBackground>
                        </TouchableOpacity>
                    </View>

                    <View style={{ alignContent:'center',alignItems:'center',width: wp('4.5%'), height: wp('4.5%'),marginLeft : 10,backgroundColor:"#c6ffb3"}}>
                        <TouchableOpacity onPress={() => {
                            setAscendingOrder(false)
                            setDescendingOrder(!descendingOrder)}
                        }>
                            <ImageBackground source={require("../assets/descending2.png")} style={{width: wp('4.5%'), height: wp('4.5%'),backgroundColor:"#c6ffb3"}}>

                            </ImageBackground>
                        </TouchableOpacity>
                    </View>


                </View>
            
                <ScrollView horizontal={true}>
                
                    <ScrollView style={{flex:1}}>

                        <Tooltip
                            isVisible={firstTime}
                            content={
                                <View >
                                <Text> Informação detalhada de cada períodos organizada por colunas. </Text>
                                <Text> T.D.B - Taxa de descarga da bateria por minuto.</Text>
                                </View>
                            }
                            arrowSize={{ width: 16, height: 8 }}
                            onClose={() => {
                                setTip(false)
                                firstTime=false //no more show tips
                                setTip2(true)
                                }
                            }
                            placement={"bottom"}
                            //displayInsets={{ top: 0,left: windowWidth/2-150,bottom: 75}}
                            // below is for the status bar of react navigation bar
                            //topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
                        >
                            <View></View>
                        </Tooltip>

                        <Tooltip
                            isVisible={showTip2}
                            content={
                                <View >
                                <Text> Escala de verde a vermelho, em que o verde representa períodos de menor perda de bateria. </Text>
                                </View>
                            }
                            arrowSize={{ width: 16, height: 8 }}
                            onClose={() => {
                                setTip2(false)
                                setTip3(true)
                                }
                            }
                            placement={"bottom"}
                            //displayInsets={{ top: 0,left: windowWidth/2-150,bottom: 75}}
                            // below is for the status bar of react navigation bar
                            //topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
                        >
                            <View></View>
                        </Tooltip>



                        <TableWrapper style={styles.row}>
                            {
                            state_table.tableData.map((cellData, cellIndex) => (
                                <Cell width={100} key={cellIndex} data={cellData} style={{backgroundColor:red(cellIndex,state)}} />
                            ))
                            }
                        </TableWrapper>

                        {isEnabled ? <View>

                            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
                                <Row data={state_table.temperature_header}  widthArr={state_table.widthArr} style={styles.header_sensors}  />
                                <Row data={state_table.temperature_data}  widthArr={state_table.widthArr} style={styles.row}  />
                                <Row data={state_table.memory_header}  widthArr={state_table.widthArr} style={styles.header_sensors}  />
                                <Row data={state_table.memory_data}  widthArr={state_table.widthArr} style={styles.row}  />
                                <Row data={state_table.cpu_header}  widthArr={state_table.widthArr} style={styles.header_sensors}  />
                                <Row data={state_table.cpu_data}  widthArr={state_table.widthArr} style={styles.row}  />
                                <Row data={state_table.brilho_header}  widthArr={state_table.widthArr} style={styles.header_sensors}  />
                                <Row data={state_table.brilho_data}  widthArr={state_table.widthArr} style={styles.row}  />
                            </Table>
                            </View> 
                        :null}

                        
                        {appsEnabled ? <View>
                                        <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
                                            <Row data={state_table.apps_header}  widthArr={state_table.widthArr} style={styles.header_sensors}  />
                                            <Cols data={state_table.tableData_apps}  widthArr={state_table.widthArr} textStyle={styles.text} /> 
                                        </Table>

                                    </View>

                       :null}

                        {sensorsEnabled ? <View>
                                            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
                                                <Row data={state_table.sensors_header}  widthArr={state_table.widthArr} style={styles.header_sensors}  />
                                                <Cols data={state_table.tableData_sensors}  widthArr={state_table.widthArr} textStyle={styles.text} /> 
                                            </Table>
                                        </View>
                        
                        

                       :null}

                        {/* {sensorsEnabled ? <View>
                                            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
                                                <Row data={state_table.sensors_header}  widthArr={state_table.widthArr} style={styles.header_sensors}  />
                                                {
                                                state_table.tableDataAux.map((cellData, cellIndex) => (

                                                        <Cell width={100/3} key={cellIndex} data={cellData}/>
                                                    )) 
                                                }
                                            </Table>
                                        </View>
                       :null} */}
                       

                        </ScrollView>
                
                </ScrollView>
            </View>
        )
    }
}
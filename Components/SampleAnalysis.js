import React, { useState } from 'react'
import * as d3scale from 'd3-scale'
import { Dimensions,View,Modal,Pressable,Text,Alert,Image, StyleSheet  } from 'react-native';
import { Svg, G, Circle,Line,Path,Rect} from 'react-native-svg'
import * as d3shape from 'd3-shape'

import {
    LineChart,
    BarChart,
    PieChart,
    ProgressChart,
    ContributionGraph,
    StackedBarChart
  } from "react-native-chart-kit";

  import CheckBox from '@react-native-community/checkbox';



//Styling
const styles = StyleSheet.create({
    svg : {
        flex:1,
        alignItems:'center'
    },

    checkbox : {
        display:"flex",
        flexDirection:'row',
        justifyContent:"center"
    }
});
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height-175;


const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 1,
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#ffa726",
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`
      },

  };


const data = {
    labels: ["1", "2", "3", "4", "5", "6","7","8","9","10"],
    datasets: [
      {
        data: [],
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
        strokeWidth: 2 // optional
      },
      {
        data: [],
        color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // optional
        strokeWidth: 2 // optional
      },
    ],
    legend: ["Sensors","Apps"] // optional
  };


  const data2 = {
    labels: ["1", "2", "3", "4", "5", "6","7","8","9","10"],
    datasets: [
      {
        data: [],
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
        strokeWidth: 2 // optional
      },
    ],
    legend: ["Sensors"] // optional
  };


  function handleClick(value){
    console.log(value)
  }

  function handleData(state){
    for(i=0;i<state.length;i++){
        count = 0
        for(j=0;j<state[i].sensors.length;j++){
            if(state[i].sensors[j] != 0 && state[i].sensors[j] != "disconnected" && state[i].sensors[j] != "disabled" ){
                count += 1
            }
        }
        data.datasets[0].data.push(count)
        data.datasets[1].data.push(state[i].apps.length)
    }
  }


export default SampleAnalysis = ({route,navigation}) => {

    const  {state}  = route.params;

    handleData(state)
    const [count, setCount] = useState(0); //used for automatically render the page.
    const [toggleCheckBox, setToggleCheckBox] = useState(false)
    const [dataToShow,setDataToShow] = useState(data)

    // data2.datasets.push({
    //     data: [3, 4, 7, 2, 1, 0, 5, 3, 7, 4],
    //     color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
    //     strokeWidth: 2 // optional
    // })


    console.log(state[10])


    return (
        <View>
            <LineChart
                data={dataToShow}
                width={windowWidth}
                height={windowHeight}
                chartConfig={chartConfig}
                withVerticalLines={false}
                withHorizontalLines={false}
                onDataPointClick ={handleClick}

            />

            <View style={styles.checkbox}>
                <Text>Apps</Text>
                <CheckBox
                    disabled={false}
                    value={toggleCheckBox}
                    onValueChange={(newValue) => {
                                    setToggleCheckBox(newValue)
                                    if(newValue==false){
                                        setDataToShow(data2)
                                    }else{
                                        setDataToShow(data)
                                    }
                                }}

                />

                <Text>Sensors</Text>
                    <CheckBox
                        disabled={false}
                        value={toggleCheckBox}
                        onValueChange={(newValue) => {
                                        setToggleCheckBox(newValue)
                                        if(newValue==false){
                                            setDataToShow(data2)
                                        }else{
                                            setDataToShow(data)
                                        }
                                    }}
                    />


                <Text>Temperature</Text>
                    <CheckBox
                        disabled={false}
                        value={toggleCheckBox}
                        onValueChange={(newValue) => {
                                        setToggleCheckBox(newValue)
                                        if(newValue==false){
                                            setDataToShow(data2)
                                        }else{
                                            setDataToShow(data)
                                        }
                                    }}
                    />
            </View>

        </View>
    )


}
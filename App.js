import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

import Plot from './Components/Plot'
import Home from './Components/Home'
import SampleAnalysis from './Components/SampleAnalysis'
import TableInfo from './Components/TableInfo'
import Help from './Components/Help'
import DisplayVideo from './Components/DisplayVideo'


export default App => {

  return (
      <NavigationContainer style={styles.container}>
        <Stack.Navigator>
          <Stack.Screen name="DisplayVideo" component={DisplayVideo} options={{ title: 'Tutorial de utilização',headerTitleStyle : {fontSize:15}} }/>
          <Stack.Screen name="Plot" component={Plot}  options={{ title: 'Períodos de utilização da bateria',headerTitleStyle : {fontSize:15}}  }/> 
          <Stack.Screen name="Home Page" component={Home}/>
          <Stack.Screen name="Help" component={Help}/>
          <Stack.Screen name="SampleAnalysis" component={SampleAnalysis}/>
          <Stack.Screen name="TableInfo" component={TableInfo} options={{ title: 'Detalhes dos períodos de utilização da bateria' ,headerTitleStyle : {fontSize:15}}}/>
        </Stack.Navigator>
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

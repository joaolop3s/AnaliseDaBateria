import React, { useEffect, useState } from 'react'
import { createIconSetFromIcoMoon } from '@expo/vector-icons';
import { Dimensions,View,Modal,Pressable,Text,Alert,Image,ScrollView } from 'react-native';
import { useFonts } from 'expo-font';
import { Button } from 'react-native';
import {Calendar} from 'react-native-calendars';

const Icon = createIconSetFromIcoMoon(
    require('../assets/icomoon/selection.json'),
    'IcoMoon',
    'icomoon.ttf'
  );

export default Help = () => {
    return(
        <View>
            <Text>Help Page</Text>
        </View>
    )
}
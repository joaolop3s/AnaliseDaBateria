import React from 'react';
import { StyleSheet, Text, View,Button,TouchableOpacity } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { Asset } from 'expo-asset';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';


export default DisplayVideo =  (props) => {
    const video = React.useRef(null);
    const [status, setStatus] = React.useState({});

    return (
      <View style={styles.container}>
        <Video
          ref={video}
          style={styles.video}
          source={require('../assets/tutorial.mp4')}
          useNativeControls
          resizeMode="contain"
          isLooping
          onPlaybackStatusUpdate={status => setStatus(() => status)}
        />
        <View style={styles.buttons}>

        <TouchableOpacity style={styles.button2}       
          onPress={() =>
            status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
          }
        >
          <Text style={{fontWeight:"bold"}}>{status.isPlaying ? 'Pausa' : 'Play'}</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.button2}       
          onPress={() =>{
            video.current.pauseAsync()
            props.navigation.navigate("Plot")  

            }
          }
        >
          <Text style={{fontWeight:"bold"}}>{"Avançar"}</Text>
        </TouchableOpacity>


        </View>
      </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    video: {
      flex: 1,
      width: wp(100)
    },
    button : {
        flex: 1
    },
    buttons : {
      display: 'flex',
      flexDirection:'row',
      justifyContent:"center",
      alignItems :"center"
    },
    button2 : {
      alignItems: "center",
      backgroundColor: "#AECDAC",
      padding: 10,
      borderRadius:20
    },
  });





import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import {colors} from "../assets/color_font/colors";
import { fonts } from '../assets/color_font/fonts';
import { useNavigation } from '@react-navigation/native';
const HomeScreen = () => {

  const navigation = useNavigation();

  const handleLogin = () =>{
    navigation.navigate("LOGIN");
  };
  const handleSignUp = () =>{
    navigation.navigate("SIGNUP");
  }

  return (
    <View style={styles.container}>
      <Image source={require("../assets/picture/logo.png")} style={styles.logo} />
      <Image source={require("../assets/picture/man.png")} style={styles.bannerImage} />
      <Text style={styles.title}> VitalTrack </Text>
      <Text style={styles.subTitle}> Designed for effortless monitoring, we provide comprehensive health tracking and fall detection, ensuring safety anytime, anywhere </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.loginButtonWrapper, {backgroundColor: colors.primary},
        ]}
        onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButtonWrapper}
        onPress={handleSignUp}>
          <Text style={styles.sigupButtonText}>Sign-Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen

const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor: colors.white,
        alignItems: "center",
    },
    logo:{
        height:40,
        width:140,
        marginVertical: 20
    },
    bannerImage:{
      marginVertical: 20,
      height:250,
      width:231,
    },
    title:{
      fontSize:40,
      fontFamily: fonts.SemiBold,
      paddingHorizontal: 20,
      color: colors.primary,
      textAlign:"center",
      marginTop: 40,
    },
    subTitle:{
      fontSize: 18,
      textAlign: "center",
      color: colors.secondary,
      fontFamily: fonts.Medium,
      paddingHorizontal: 20,
      marginVertical:20
    },
    buttonContainer:{
      flexDirection: "row",
      marginTop: 20,
      borderWidth: 2,
      borderColor: colors.primary,
      width: "85%",
      height: 60 ,
      borderRadius: 100
    },
    loginButtonWrapper:{
        justifyContent: "center",
        alignItems: "center",
        width: "50%",
        borderRadius: 98
    },
    loginButtonText:{
      color: colors.white,
      fontSize: 18,
      fontFamily: fonts.SemiBold
    },
    sigupButtonText: {
      fontSize: 18,
      fontFamily: fonts.SemiBold
    }
});
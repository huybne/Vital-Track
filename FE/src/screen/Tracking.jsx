import React, {useState, useCallback} from 'react';
import {StyleSheet, View, Text, ActivityIndicator} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import {useFocusEffect} from '@react-navigation/native';
import {getCurrentLocation, getAddressFromCoordinates} from '../utils/gps';

MapboxGL.setAccessToken(
  'pk.eyJ1IjoiYnVpcXVhbmdodXkiLCJhIjoiY20yeDQyYXZkMDB1dzJqcTIwZDVobmM3NCJ9.13xXBbWqBlkcqgaMsT0kGw',
);

const Tracking = ({route}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [isUserAddressFetched, setIsUserAddressFetched] = useState(false);

  const latitude = route.params?.latitude;
  const longitude = route.params?.longitude;
  useFocusEffect(
    useCallback(() => {
      fetchLocation();
      if (latitude && longitude && !isUserAddressFetched) {
        // Chỉ gọi khi chưa fetch
        fetchUserAddress();
        setIsUserAddressFetched(true);
      }
    }, [latitude, longitude, isUserAddressFetched]),
  );
  const fetchLocation = async () => {
    try {
      const {latitude, longitude} = await getCurrentLocation();
      setLocation([longitude, latitude]);

      const fetchedAddress = await getAddressFromCoordinates(
        latitude,
        longitude,
      );
      setAddress(fetchedAddress);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUserAddress = async () => {
    if (latitude && longitude) {
      try {
        const fetchedAddress = await getAddressFromCoordinates(
          latitude,
          longitude,
        );
        setUserAddress(fetchedAddress);
      } catch (err) {
        console.error('Error fetching user address:', err);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLocation();
      if (latitude && longitude) {
        fetchUserAddress();
      }
    }, [latitude, longitude]),
  );

  if (!location) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
        {error ? <Text>Error: {error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera zoomLevel={12} centerCoordinate={location} />

        {/* Marker cho vị trí hiện tại của bạn */}
        <MapboxGL.PointAnnotation coordinate={location} id="user-location">
          <View style={styles.annotationContainer}>
            <Text style={styles.annotationText}>📍</Text>
          </View>
          <MapboxGL.Callout>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutText}>Your Location: {address}</Text>
            </View>
          </MapboxGL.Callout>
        </MapboxGL.PointAnnotation>

        {/* Chỉ hiển thị marker cho user khác nếu có latitude và longitude */}
        {latitude && longitude && (
          <MapboxGL.PointAnnotation
            coordinate={[longitude, latitude]}
            id="other-user-location">
            <View style={styles.annotationContainerOther}>
              <Text style={styles.annotationText}>👤</Text>
            </View>
            <MapboxGL.Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>
                  User Location: {userAddress}
                </Text>
              </View>
            </MapboxGL.Callout>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>
    </View>
  );
};

export default Tracking;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  annotationContainer: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 50,
  },
  annotationContainerOther: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 50,
  },
  annotationText: {
    color: 'white',
  },
  calloutContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    width: 250,
    maxWidth: 300,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutText: {
    color: 'black',
    fontSize: 14,
    textAlign: 'left',
  },
});

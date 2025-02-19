import React, {useCallback, useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {colors} from '../assets/color_font/colors';
import {fonts} from '../assets/color_font/fonts';
import {getPendingRequest, acceptRequest, denyRequest} from '../utils/api';

const RequestScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]); // List of pending requests

  // Fetch pending requests
  const fetchPendingRequests = async () => {
    const data = await getPendingRequest();
    setPendingRequests(data);
  };

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPendingRequests();
    setRefreshing(false);
  }, []);

  // Handle Accept Request
  const handleAccept = async username => {
    const response = await acceptRequest(username);
    if (response.success) {
      alert('Request accepted successfully.');
      fetchPendingRequests(); // Refresh after accepting
    } else {
      alert(`Error: ${response.message}`);
    }
  };

  // Handle Deny Request
  const handleDeny = async username => {
    const response = await denyRequest(username);
    if (response.success) {
      alert('Request denied successfully.');
      fetchPendingRequests(); // Refresh after denying
    } else {
      alert(`Error: ${response.message}`);
    }
  };

  // Fetch pending requests on component mount
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Render each request item
  const renderRequestItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.profileSection}>
        {item.avatar ? (
          <Image source={{uri: item.avatar}} style={styles.avatar} />
        ) : (
          <View style={styles.textAvatar}>
            <Text style={styles.avatarText}>
              {item.username ? item.username.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.details}>
            {item.fullName ? item.fullName : 'Unknown Name'}  {item.telephone}
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleAccept(item.username)}>
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={() => handleDeny(item.username)}>
          <Text style={{color: "#000000"}}>Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Requests</Text>
      <FlatList
        data={pendingRequests}
        keyExtractor={(item, index) => `${item.username}-${index}`}
        renderItem={renderRequestItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{paddingBottom: 20}}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>No pending requests found.</Text>
        }
      />
    </View>
  );
};

export default RequestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
  },
  title: {
    marginTop: 20,

    fontFamily: fonts.Bold,
    fontSize: 25,
    color: '#000000',
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#87ceeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontFamily: fonts.Bold,
    fontSize: 18,
    color: '#fff', // Text color
  },

  userInfo: {
    flex: 1,
  },
  username: {
    fontFamily: fonts.Bold,
    fontSize: 16,
    color: '#333',
  },
  details: {
    fontFamily: fonts.Regular,
    fontSize: 14,
    color: '#888',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: '#87ceeb',
  },
  denyButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontFamily: fonts.SemiBold,
    fontSize: 14,
    color: '#fff',
  },
  emptyMessage: {
    fontFamily: fonts.Regular,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
});

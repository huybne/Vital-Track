import database from '@react-native-firebase/database';


export const putDataToFirebase = async (path, data) => {
  try {
    await database().ref(path).set(data);
    console.log(`Data pushed successfully to path: ${path}`);
  } catch (error) {
    console.error(`Error pushing data to path: ${path}`, error);
    throw error;
  }
};

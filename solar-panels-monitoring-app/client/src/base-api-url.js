// import axios from 'axios';


const BASE_API_URL = 'https://rrvxlzsz-3000.asse.devtunnels.ms';
//const localBaseURL = 'http://localhost:3000';

export default BASE_API_URL;

// // ฟังก์ชันเพื่อตรวจสอบการเข้าถึง
// const checkPublicAccess = async (url) => {
//     try {
//         await axios.get(url);
//         return true; // สามารถเข้าถึง public ได้
//     } catch (error) {
//         return false; // ไม่สามารถเข้าถึง public
//     }
// };

// const axiosInstance = axios.create();

// // ฟังก์ชันเพื่อตั้งค่า base URL
// const setBaseURL = async () => {
//     const isPublicAccessible = await checkPublicAccess(publicBaseURL);
//     axiosInstance.defaults.baseURL = isPublicAccessible ? publicBaseURL : localBaseURL;
// };

// // เรียกใช้ฟังก์ชันเพื่อกำหนด base URL
// setBaseURL();

// export default axiosInstance;

import logo from './logo.svg'
import searchIcon from './searchIcon.svg'
import userIcon from './userIcon.svg'
import calenderIcon from './calenderIcon.svg'
import locationIcon from './locationIcon.svg'
import starIconFilled from './starIconFilled.svg'
import arrowIcon from './arrowIcon.svg'
import starIconOutlined from './starIconOutlined.svg'
import instagramIcon from './instagramIcon.svg'
import facebookIcon from './facebookIcon.svg'
import twitterIcon from './twitterIcon.svg'
import linkendinIcon from './linkendinIcon.svg'
import freeWifiIcon from './freeWifiIcon.svg'
import freeBreakfastIcon from './freeBreakfastIcon.svg'
import roomServiceIcon from './roomServiceIcon.svg'
import mountainIcon from './mountainIcon.svg'
import poolIcon from './poolIcon.svg'
import homeIcon from './homeIcon.svg'
import closeIcon from './closeIcon.svg'
import locationFilledIcon from './locationFilledIcon.svg'
import heartIcon from './heartIcon.svg'
import badgeIcon from './badgeIcon.svg'
import menuIcon from './menuIcon.svg'
import closeMenu from './closeMenu.svg'
import guestsIcon from './guestsIcon.svg'
import roomImg1 from './roomImg1.png'
import roomImg2 from './roomImg2.png'
import roomImg3 from './roomImg3.png'
import roomImg4 from './roomImg4.png'
import regImage from './regImage.png'
import exclusiveOfferCardImg1 from "./exclusiveOfferCardImg1.png";
import exclusiveOfferCardImg2 from "./exclusiveOfferCardImg2.png";
import exclusiveOfferCardImg3 from "./exclusiveOfferCardImg3.png";
import addIcon from "./addIcon.svg";
import dashboardIcon from "./dashboardIcon.svg";
import listIcon from "./listIcon.svg";
import uploadArea from "./uploadArea.svg";
import totalBookingIcon from "./totalBookingIcon.svg";
import totalRevenueIcon from "./totalRevenueIcon.svg";


export const assets = {
    logo,
    searchIcon,
    userIcon,
    calenderIcon,
    locationIcon,
    starIconFilled,
    arrowIcon,
    starIconOutlined,
    instagramIcon,
    facebookIcon,
    twitterIcon,
    linkendinIcon,
    freeWifiIcon,
    freeBreakfastIcon,
    roomServiceIcon,
    mountainIcon,
    poolIcon,
    closeIcon,
    homeIcon,
    locationFilledIcon,
    heartIcon,
    badgeIcon,
    menuIcon,
    closeMenu,
    guestsIcon,
    regImage,
    addIcon,
    dashboardIcon,
    listIcon,
    uploadArea,
    totalBookingIcon,
    totalRevenueIcon,
}
// Exclusive Service Dummy Data
export const ServiceDummyData = [
  {
    _id: "offer-1",
    serviceName: "Buffe Sáng",
    pricePerNight: 1200,
    images: [exclusiveOfferCardImg1],
    descriptionShort: "Thưởng thức bữa sáng tự chọn đa dạng với nhiều món ăn ngon miệng",
    descriptionLong: "Tại đây, các bạn sẽ được phục vụ bữa sáng tự chọn với nhiều món ăn đa dạng và ngon miệng. Chất lượng đảm bảo, quy trình chuyên nghiệp, từ các món truyền thống đến các món quốc tế, buffet sáng của chúng tôi đáp ứng mọi sở thích ẩm thực. Giờ mở cửa sẽ là 6.30am, và kết thúc vào lúc 9.30am. Hãy bắt đầu ngày mới của bạn với một bữa sáng thịnh soạn và đầy năng lượng tại khách sạn của chúng tôi.",
    isAvailable: true,
    createdAt: "2025-06-01T06:26:04.013Z",
    updatedAt: "2025-06-01T06:26:04.013Z",
    __v: 0,
  },
  {
    _id: "offer-2",
    serviceName: "Bể Bơi Riêng",
    pricePerNight: 1500,
    images: [exclusiveOfferCardImg2],
    isAvailable: false,
    descriptionShort: "Thư giãn và tận hưởng không gian riêng tư với bể bơi chỉ dành cho bạn",
    descriptionLong: "Hồ bơi của chúng tôi, với công nghệ lọc nước hiện đại và hệ thống an ninh nghiêm ngặt, đảm bảo mang đến cho bạn một trải nghiệm bơi lội an toàn và thoải mái. Cùng với nhiều dịch vụ đi kèm, các bạn sẽ được đắm mình trong làn nước mát lạnh, thư giãn sau những năm tháng mệt nhọc. Giờ mở cửa của hồ bơi là từ 6:00 sáng đến 9:00 tối hàng ngày. Hãy tận hưởng những khoảnh khắc thư giãn và vui vẻ bên gia đình và bạn bè tại hồ bơi của chúng tôi.",
    createdAt: "2025-06-01T06:26:04.013Z",
    updatedAt: "2025-06-01T06:26:04.013Z",
    __v: 0,
  },
  {
    _id: "offer-3",
    serviceName: "Phòng Gym",
    pricePerNight: 2000,
    images: [exclusiveOfferCardImg3],
    isAvailable: true,
    descriptionShort: "Tập luyện chăm chỉ để lấy lại vóc dáng và sức khỏe trong phòng gym hiện đại",
    descriptionLong: "Hệ thống phòng tập được xây dựng dựa theo tiêu chuẩn quốc tế, với không gian rộng rãi, thoáng mát và trang thiết bị hiện đại. Tại đây, các bạn sẽ được trải nghiệm các bài tập đa dạng từ cardio, cử tạ đến yoga và pilates, giúp bạn đạt được mục tiêu sức khỏe và thể hình của mình, phục hồi năng lượng chuẩn bị cho ngày mới. Phòng gym của chúng tôi mở cửa từ 5:00 sáng đến 10:00 tối hàng ngày, tạo điều kiện thuận lợi cho bạn tập luyện vào bất kỳ thời gian nào trong ngày. Hãy đến và khám phá không gian tập luyện chuyên nghiệp tại phòng gym của chúng tôi.",
    createdAt: "2025-06-01T06:26:04.013Z",
    updatedAt: "2025-06-01T06:26:04.013Z",
    __v: 0,
  },
]


// Testimonials Dummy Data
export const testimonials = [
    { id: 1, name: "Emma Rodriguez", address: "Barcelona, Spain", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200", rating: 5, review: "I've used many booking platforms before, but none compare to the personalized experience and attention to detail that QuickStay provides." },
    { id: 2, name: "Liam Johnson", address: "New York, USA", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200", rating: 4, review: "QuickStay exceeded my expectations. The booking process was seamless, and the hotels were absolutely top-notch. Highly recommended!" },
    { id: 3, name: "Sophia Lee", address: "Seoul, South Korea", image: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?q=80&w=200", rating: 5, review: "Amazing service! I always find the best luxury accommodations through QuickStay. Their recommendations never disappoint!" }
];

// Facility Icon
export const facilityIcons = {
    "Free WiFi": assets.freeWifiIcon,
    "Free Breakfast": assets.freeBreakfastIcon,
    "Room Service": assets.roomServiceIcon,
    "Mountain View": assets.mountainIcon,
    "Pool Access": assets.poolIcon,
};

// For Room Details Page
export const roomCommonData = [
    { icon: assets.homeIcon, title: "Clean & Safe Stay", description: "A well-maintained and hygienic space just for you." },
    { icon: assets.badgeIcon, title: "Enhanced Cleaning", description: "This host follows Staybnb's strict cleaning standards." },
    { icon: assets.locationFilledIcon, title: "Excellent Location", description: "90% of guests rated the location 5 stars." },
    { icon: assets.heartIcon, title: "Smooth Check-In", description: "100% of guests gave check-in a 5-star rating." },
];

// User Dummy Data
export const userDummyData = {
    "_id": "user_2unqyL4diJFP1E3pIBnasc7w8hP",
    "username": "Great Stack",
    "email": "user.greatstack@gmail.com",
    "image": "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ2N2c5YVpSSEFVYVUxbmVYZ2JkSVVuWnFzWSJ9",
    "role": "hotelOwner",
    "createdAt": "2025-03-25T09:29:16.367Z",
    "updatedAt": "2025-04-10T06:34:48.719Z",
    "__v": 1,
    "recentSearchedCities": [
        "Đà Lạt"
    ]
}

// Hotel Dummy Data
export const hotelDummyData = {
    "_id": "67f76393197ac559e4089b72",
    "name": "Nhớ Một Người Hotel",
    "description": "Khách sạn Nhớ Một Người tọa lạc tại trung tâm thành phố Đà Lạt, mang đến cho du khách trải nghiệm nghỉ dưỡng đẳng cấp với không gian sang trọng và tiện nghi hiện đại. Với vị trí thuận lợi, khách sạn chỉ cách các điểm tham quan nổi tiếng như Hồ Xuân Hương, Chợ Đà Lạt và Vườn Hoa Thành Phố chỉ vài phút đi bộ. Khách sạn cung cấp nhiều loại phòng đa dạng từ phòng tiêu chuẩn đến phòng suite cao cấp, tất cả đều được trang bị đầy đủ tiện nghi, mang lại sự thoải mái tối đa cho du khách. Ngoài ra, khách sạn còn có nhà hàng phục vụ các món ăn đặc sản địa phương và quốc tế, cùng với các dịch vụ như spa, phòng tập gym và hồ bơi ngoài trời. Đội ngũ nhân viên chuyên nghiệp và thân thiện luôn sẵn sàng hỗ trợ để đảm bảo kỳ nghỉ của bạn tại Đà Lạt trở nên đáng nhớ và trọn vẹn.",
    "address": "123 Đường Lê Đại Hành, Phường 3, Đà Lạt, Lâm Đồng",
    "contact": "0123456789",
    "owner": userDummyData,
    "createdAt": "2025-04-10T06:22:11.663Z",
    "updatedAt": "2025-04-10T06:22:11.663Z",
    "__v": 0
}

// Rooms Dummy Data
export const roomsDummyData = [
    {
        "_id": "67f7647c197ac559e4089b96",
        "name": "Phòng 101",
        "hotel": hotelDummyData,
        "roomType": "Phòng Thường",
        "bedType": "Phòng Đơn",
        "pricePerNight": 399000,
        "images": [roomImg1],
        isAvailable: true,
        "createdAt": "2025-04-10T06:26:04.013Z",
        "updatedAt": "2025-04-10T06:26:04.013Z",
        "__v": 0
    },
    {
        "_id": "67f76452197ac559e4089b8e",
        "name": "Phòng 102",
        "hotel": hotelDummyData,
        "roomType": "Phòng Thường",
        "bedType": "Phòng Đôi",
        "pricePerNight": 299000,
        "images": [roomImg2],
        isAvailable: true,
        "createdAt": "2025-04-10T06:25:22.593Z",
        "updatedAt": "2025-04-10T06:25:22.593Z",
        "__v": 0
    },
    {
        "_id": "67f76406197ac559e4089b82",
        "name": "Phòng 103",
        "hotel": hotelDummyData,
        "roomType": "Phòng VIP",
        "bedType": "Phòng Đôi",
        "pricePerNight": 249000,
        "images": [roomImg3],
        isAvailable: true,
        "createdAt": "2025-04-10T06:24:06.285Z",
        "updatedAt": "2025-04-10T06:24:06.285Z",
        "__v": 0
    },
    {
        "_id": "67f763d8197ac559e4089b7a",
        "name": "Phòng 104",
        "hotel": hotelDummyData,
        "roomType": "Phòng VIP",
        "bedType": "Phòng Đơn",
        "pricePerNight": 199000,
        "images": [roomImg4],
        isAvailable: false,
        "createdAt": "2025-04-10T06:23:20.252Z",
        "updatedAt": "2025-04-10T06:23:20.252Z",
        "__v": 0
    }
]



// User Bookings Dummy Data
export const userBookingsDummyData = [
    {
        "_id": "67f76839994a731e97d3b8ce",
        "user": userDummyData,
        "room": roomsDummyData[1],
        "hotel": hotelDummyData,
        "checkInDate": "2025-04-30T00:00:00.000Z",
        "checkOutDate": "2025-05-01T00:00:00.000Z",
        "totalPrice": 299,
        "guests": 1,
        "status": "pending",
        "paymentMethod": "Stripe",
        "isPaid": true,
        "createdAt": "2025-04-10T06:42:01.529Z",
        "updatedAt": "2025-04-10T06:43:54.520Z",
        "__v": 0
    },
    {
        "_id": "67f76829994a731e97d3b8c3",
        "user": userDummyData,
        "room": roomsDummyData[0],
        "hotel": hotelDummyData,
        "checkInDate": "2025-04-27T00:00:00.000Z",
        "checkOutDate": "2025-04-28T00:00:00.000Z",
        "totalPrice": 399,
        "guests": 1,
        "status": "pending",
        "paymentMethod": "Pay At Hotel",
        "isPaid": false,
        "createdAt": "2025-04-10T06:41:45.873Z",
        "updatedAt": "2025-04-10T06:41:45.873Z",
        "__v": 0
    },
    {
        "_id": "67f76810994a731e97d3b8b4",
        "user": userDummyData,
        "room": roomsDummyData[3],
        "hotel": hotelDummyData,
        "checkInDate": "2025-04-11T00:00:00.000Z",
        "checkOutDate": "2025-04-12T00:00:00.000Z",
        "totalPrice": 199,
        "guests": 1,
        "status": "pending",
        "paymentMethod": "Pay At Hotel",
        "isPaid": false,
        "createdAt": "2025-04-10T06:41:20.501Z",
        "updatedAt": "2025-04-10T06:41:20.501Z",
        "__v": 0
    }
]

// Dashboard Dummy Data
export const dashboardDummyData = {
    "totalBookings": 3,
    "totalRevenue": 897,
    "bookings": userBookingsDummyData
}

// --------- SVG code for Book Icon------
/* 
const BookIcon = ()=>(
    <svg className="w-4 h-4 text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" >
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13H7a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12M9 3v14m7 0v4" />
</svg>
)

*/
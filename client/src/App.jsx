import Navbar from './components/Navbar.jsx';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Footer from './components/Footer.jsx';
import ListRoom from './pages/ListRoom.jsx';
import ListService from './pages/ListService.jsx';
import ServiceDetails from './pages/ServiceDetails.jsx';
import Contact from './pages/Contact.jsx';
import Profile from './pages/Profile.jsx';
import BookRoom from './pages/BookRoom.jsx';
import InvoiceDetail from "./pages/InvoiceDetail.jsx";
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { authAction } from './redux/slice.js';

// ✨ Thêm thư viện toast
import { Toaster } from 'react-hot-toast';

const App = () => {
  const isOwnerPath = useLocation().pathname.includes('owner');
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem("id")) {
      dispatch(authAction.login());
      dispatch(authAction.changeRole(localStorage.getItem("role")));
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6]">
      {!isOwnerPath && <Navbar />}

      {/* ✅ Thêm Toaster - nằm ngoài Routes để toast toàn cục */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '12px 18px',
            fontSize: '15px',
          },
          success: {
            iconTheme: {
              primary: '#d4a373', // vàng đồng sang trọng
              secondary: '#fff',
            },
          },
          error: {
            style: {
              background: '#fff5f5',
              border: '1px solid #e58e8e',
            },
            iconTheme: {
              primary: '#e63946',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Nội dung chính */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dat-phong" element={<ListRoom />} />
          <Route path="/dat-phong/:id" element={<BookRoom />} />
          <Route path="/dich-vu" element={<ListService />} />
          <Route path="/chi-tiet-dich-vu/:id" element={<ServiceDetails />} />
          <Route path="/lien-he" element={<Contact />} />
          <Route path="/thong-tin-ca-nhan" element={<Profile />} />
          <Route path="/chi-tiet-hoa-don/:id" element={<InvoiceDetail />} />
        </Routes>
      </main>

      {!isOwnerPath && <Footer />}
    </div>
  );
};

export default App;

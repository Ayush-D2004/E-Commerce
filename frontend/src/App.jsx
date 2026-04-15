import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import SearchResultsPage from './pages/SearchResultsPage';
import AccountDashboard from './pages/AccountDashboard';
import WishlistPage from './pages/WishlistPage';
import AddressBookPage from './pages/AddressBookPage';
import PaymentsPage from './pages/PaymentsPage';
import NotificationsPage from './pages/NotificationsPage';
import CustomerServicePage from './pages/CustomerServicePage';
import GiftCardsPage from './pages/GiftCardsPage';
import BusinessAccountPage from './pages/BusinessAccountPage';
import DigitalServicesPage from './pages/DigitalServicesPage';
import LoginSecurityPage from './pages/LoginSecurityPage';
import AmazonFamilyPage from './pages/AmazonFamilyPage';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, backgroundColor: '#eaeded' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/account" element={<AccountDashboard />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/addresses" element={<AddressBookPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/customer-service" element={<CustomerServicePage />} />
            <Route path="/gift-cards" element={<GiftCardsPage />} />
            <Route path="/business-account" element={<BusinessAccountPage />} />
            <Route path="/digital-services" element={<DigitalServicesPage />} />
            <Route path="/account/security" element={<LoginSecurityPage />} />
            <Route path="/amazon-family" element={<AmazonFamilyPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

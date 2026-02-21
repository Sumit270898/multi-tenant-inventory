import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { Products } from '../pages/Products';
import { Orders } from '../pages/Orders';
import { Suppliers } from '../pages/Suppliers';
import { PurchaseOrders } from '../pages/PurchaseOrders';
import { Users } from '../pages/Users';
import { Dashboard } from '../pages/Dashboard';
import { StockMovements } from '../pages/StockMovements';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/users" element={<Users />} />
        <Route path="/stock-movements" element={<StockMovements />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

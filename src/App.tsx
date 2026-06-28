import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import PlaylistDetail from "@/pages/PlaylistDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Me from "@/pages/Me";
import Import from "@/pages/Import";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/playlist/:id" element={<PlaylistDetail />} />
        <Route path="/import" element={<Import />} />
        <Route path="/me" element={<Me />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

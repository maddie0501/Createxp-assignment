import React from "react";
import { mockClients } from "./data/MockData";
import ClientTable from "./components/ClientTable";
import "./App.css";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 ">
      <ClientTable clients={mockClients} />
    </div>
  );
}

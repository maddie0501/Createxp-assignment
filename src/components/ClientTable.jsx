import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  User,
  CalendarDays,
  SquareUser,
  Table2,
} from "lucide-react";
import { mockClients } from "../data/MockData";

function SortItem({ item, onDirectionToggle, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const labelIcons = {
    "Client Name": <User className="w-4 h-4 text-gray-500" />,
    "Created At": <CalendarDays className="w-4 h-4 text-gray-500" />,
    "Updated At": <CalendarDays className="w-4 h-4 text-gray-500" />,
    "Client ID": <SquareUser className="w-4 h-4 text-gray-500" />,
  };

  const isDateField = ["Created At", "Updated At"].includes(item.label);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white py-3 flex justify-between items-center"
    >
      <div className="flex items-center gap-2" {...listeners}>
        <span className="cursor-move text-gray-400">☰</span>
        <span className="text-gray-800 font-medium flex items-center gap-2">
          {labelIcons[item.label] || "🔤"} {item.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`text-xs font-bold px-2 py-1 rounded ${
            item.direction === "asc"
              ? "bg-blue-100 text-blue-500"
              : "bg-gray-100 text-gray-500"
          }`}
          onClick={() => onDirectionToggle(item.key, "asc")}
        >
          {isDateField ? "↑ Newest to Oldest" : "↑ A-Z"}
        </button>
        <button
          className={`text-xs font-bold px-2 py-1 rounded  ${
            item.direction === "desc"
              ? "bg-blue-100 text-blue-500"
              : "bg-gray-100 text-gray-500"
          }`}
          onClick={() => onDirectionToggle(item.key, "desc")}
        >
          {isDateField ? "↓ Oldest to Newest" : "↓ Z-A"}
        </button>
        <button
          className="text-gray-400 hover:text-red-500 text-xl"
          onClick={() => onRemove(item.key)}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

function SortPanel({
  sortOptions,
  setSortOptions,
  onApply,
  onClear,
  setShowSortPanel,
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sortOptions.findIndex((i) => i.key === active.id);
      const newIndex = sortOptions.findIndex((i) => i.key === over?.id);
      setSortOptions(arrayMove(sortOptions, oldIndex, newIndex));
    }
  };

  const handleDirectionToggle = (key, direction) => {
    setSortOptions((prev) =>
      prev.map((item) => (item.key === key ? { ...item, direction } : item))
    );
  };

  const handleAdd = (key) => {
    if (!sortOptions.some((i) => i.key === key)) {
      setSortOptions((prev) => [
        ...prev,
        { key, label: key, direction: "asc" },
      ]);
    }
  };

  const handleRemove = (key) => {
    setSortOptions((prev) => prev.filter((i) => i.key !== key));
  };

  const availableFields = [
    "Client Name",
    "Created At",
    "Updated At",
    "Client ID",
  ];

  const applySortCriteria = () => {
    setShowSortPanel(false);
    if (onApply) onApply();
  };

  const clearAllCriteria = () => {
    setSortOptions([]);

    if (onClear) onClear();
  };

  return (
    <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border w-[520px] p-5 z-50">
      <h3 className="text-lg font-semibold mb-4">Sort By</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortOptions.map((item) => item.key)}
          strategy={verticalListSortingStrategy}
        >
          {sortOptions.map((item) => (
            <SortItem
              key={item.key}
              item={item}
              onDirectionToggle={handleDirectionToggle}
              onRemove={handleRemove}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex flex-wrap gap-3">
        {availableFields
          .filter((f) => !sortOptions.some((i) => i.key === f))
          .map((f) => (
            <button key={f} className="text-sm" onClick={() => handleAdd(f)}>
              + {f}
            </button>
          ))}
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
        <button
          className="text-sm text-gray-600 hover:underline"
          onClick={clearAllCriteria}
        >
          Clear all
        </button>
        <button
          className="bg-black text-white text-sm px-4 py-2 rounded-md"
          onClick={applySortCriteria}
        >
          Apply Sort
        </button>
      </div>
    </div>
  );
}

export default function ClientPage() {
  const [clients] = useState(mockClients);
  const [activeTab, setActiveTab] = useState("All");
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [sortOptions, setSortOptions] = useState([]);
  const [sortedClients, setSortedClients] = useState([]);
  const [isSortApplied, setIsSortApplied] = useState(false);
  const [filteredClients, setFilteredClients] = useState(clients);

  const tabs = ["All", "Individual", "Company"];

  const fieldKeyMap = {
    "Client Name": "name",
    "Client ID": "id",
    "Client Type": "type",
    Email: "email",
    Status: "status",
    "Created At": "createdAt",
    "Updated At": "updatedAt",
    "Updated By": "updatedBy",
  };

  useEffect(() => {
    const baseClients =
      activeTab === "All"
        ? clients
        : clients.filter((client) => client.type === activeTab);

    setFilteredClients(baseClients);
  }, [activeTab, clients]);

  const applySorting = useCallback(() => {
    const sorted = [...clients].sort((a, b) => {
      for (let option of sortOptions) {
        const { key, direction } = option;
        const aValue = a[key];
        const bValue = b[key];

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredClients(sorted);
  }, [clients, sortOptions]);

  useEffect(() => {
    if (sortOptions.length > 0) {
      applySorting();
    }
  }, [sortOptions, applySorting]);

  const handleApplySort = () => {
    setShowSortPanel(false);

    const sorted = [...clients].sort((a, b) => {
      for (const option of sortOptions) {
        const key = fieldKeyMap[option.label] || option.key;
        const direction = option.direction === "asc" ? 1 : -1;
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
      }
      return 0;
    });

    localStorage.setItem("sortedClients", JSON.stringify(sorted));
    localStorage.setItem("sortOptions", JSON.stringify(sortOptions));
    setFilteredClients(sorted);
  };

  const handleClearSort = () => {
    setSortOptions([]);
    localStorage.removeItem("sortCriteria");
    setSortedClients([]);
    setIsSortApplied(false);
    localStorage.removeItem("sortOptions");
  };

  useEffect(() => {
    const savedClients = localStorage.getItem("sortedClients");
    if (savedClients) {
      setFilteredClients(JSON.parse(savedClients));
    } else {
      setFilteredClients(clients);
    }

    const savedSort = localStorage.getItem("sortCriteria");
    if (savedSort) {
      setSortOptions(JSON.parse(savedSort));
    }

    const storedSort = localStorage.getItem("sortOptions");
    if (storedSort) {
      setSortOptions(JSON.parse(storedSort));
    }
  }, [clients]);

  const onAddClient = () => {
    alert("Add Client clicked");
  };

  return (
    <div className="p-4 relative">
      <div className="p-2 border-b border-b-gray-200">
        <h1 className="text-xl font-semibold">Clients</h1>
      </div>

      {/* Top Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4 px-4 py-3">
        <div className="flex flex-wrap gap-4 items-center">
          {tabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer px-3 py-2 text-sm font-semibold border-b-3 ${
                activeTab === tab
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 relative">
          <Search className="w-5 h-5 text-gray-600 cursor-pointer" />

          <div className="relative">
            <ArrowUpDown
              className="w-5 h-5 text-gray-600 cursor-pointer"
              onClick={() => setShowSortPanel((prev) => !prev)}
            />

            {sortOptions.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 shadow-md">
                {sortOptions.length}
              </span>
            )}
            {showSortPanel && (
              <SortPanel
                sortOptions={sortOptions}
                setSortOptions={setSortOptions}
                onApply={handleApplySort}
                onClear={handleClearSort}
                setShowSortPanel={setShowSortPanel}
              />
            )}
          </div>

          <Filter className="w-5 h-5 text-gray-600 cursor-pointer" />
          <button
            onClick={onAddClient}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium shadow hover:bg-gray-900"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md overflow-hidden border border-gray-300 border-b-10 border-b-gray-200 rounded-b-md ">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-500">
            <tr>
              <th className="border-b border-gray-300 p-2 text-center w-10">
                <Table2 className="w-4 h-4 mx-auto text-gray-500" />
              </th>
              <th className="border-b border-gray-300 p-2">Client ID</th>
              <th className="border-b border-gray-300 p-2">Client Name</th>
              <th className="border-b border-gray-300 p-2">Client Type</th>
              <th className="border-b border-gray-300 p-2">Email</th>
              <th className="border-b border-gray-300 p-2">Status</th>
              <th className="border-b border-gray-300 p-2">Created At</th>
              <th className="border-b border-gray-300 p-2">Updated By</th>
            </tr>
          </thead>
          <tbody className="font-semibold">
            {(isSortApplied ? sortedClients : filteredClients).map((client) => (
              <tr key={client.id} className="border-t">
                <td className="border-b border-gray-300 p-2 text-center"></td>
                <td className="border-b border-gray-300 p-2 text-blue-500">
                  {client.id}
                </td>
                <td className="border-b border-gray-300 p-2">{client.name}</td>
                <td className="border-b border-gray-300 p-2">{client.type}</td>
                <td className="border-b border-gray-300 p-2">{client.email}</td>
                <td className="border-b border-gray-300 p-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 inline-block rounded-full bg-green-500 shadow-[0_0_10px_6px_rgba(34,197,94,0.5)]"></span>
                    {client.status}
                  </div>
                </td>

                <td className="border-b border-gray-300 p-2">
                  {client.createdAt}
                </td>
                <td className="border-b border-gray-300 p-2">
                  {client.updatedBy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

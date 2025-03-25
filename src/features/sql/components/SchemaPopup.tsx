import { CircleX, Database, Eye, Table as TableIcon } from "lucide-react";
import { SchemaPopupProps } from "../types";

const SchemaPopup = ({
  setShowSchema,
  selectedExercise,
  setActiveTableTab,
  activeTableTab,
}: SchemaPopupProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-stretch gap-3">
              <Database className="text-blue-600" size={32} />
              <h2 className="text-2xl font-bold">Database Schema</h2>
            </div>
            <div
              onClick={() => setShowSchema(false)}
              className=" text-gray-700 hover:text-red-600 transition-colors cursor-pointer"
            >
              <CircleX size={24} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {selectedExercise.tables.map((table) => (
              <div
                key={table.name}
                onClick={() => setActiveTableTab(table.name)}
                className={`cursor-pointer px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTableTab === table.name
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
              >
                <TableIcon size={16} />
                {table.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedExercise.tables
            .filter((table) => table.name === activeTableTab)
            .map((table) => (
              <div key={table.name} className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Table Structure
                  </h3>
                  <div className="overflow-x-auto rounded-lg border bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Column Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {table.schema.map((column, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {column[0]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {column[1]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-stretch gap-2 mb-4">
                    <Eye size={32} className="text-blue-600" />
                    <h3 className="text-lg font-semibold">Sample Data</h3>
                  </div>
                  <div className="overflow-x-auto rounded-lg border bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(table.sampleData[0]).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {table.sampleData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {Object.values(row).map((value: string, i) => (
                              <td
                                key={i}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SchemaPopup;

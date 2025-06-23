import Fuse from "fuse.js";
import React, { useState, useEffect, useMemo } from "react";

interface SavedQuery {
  operationName: string;
  id: string;
  name: string;
  category: string;
  description: string;
  query: string;
  variables: string;
}

interface ExamplesPageProps {
  examples: SavedQuery[];
}

type SortOption = "name" | "category" | "recent";

const ExamplesPage: React.FC<ExamplesPageProps> = ({ examples }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [filteredExamples, setFilteredExamples] = useState<SavedQuery[]>(examples);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    examples.forEach((example) => {
      categoryMap.set(example.category, (categoryMap.get(example.category) || 0) + 1);
    });
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [examples]);

  const fuse = useMemo(() => {
    return new Fuse(examples, {
      keys: ["name", "description"],
      threshold: 0.3,
      includeScore: true,
    });
  }, [examples]);

  useEffect(() => {
    let filtered = examples;

    if (searchTerm.trim()) {
      const searchResults = fuse.search(searchTerm);
      filtered = searchResults.map((result) => result.item);
    }

    if (selectedCategory) {
      filtered = filtered.filter((example) => example.category === selectedCategory);
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        case "recent":
          return parseInt(b.id) - parseInt(a.id); // Assuming higher ID = more recent
        default:
          return 0;
      }
    });

    setFilteredExamples(filtered);
  }, [searchTerm, selectedCategory, sortBy, examples, fuse]);

  const handleOpenInENSAdmin = (query: string, variables: string) => {
    try {
      const baseUrl = "https://admin.ensnode.io/gql/subgraph-compat";
      const params = new URLSearchParams({
        query: query.trim(),
        variables: variables.trim(),
      });
      const url = `${baseUrl}?${params.toString()}`;

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open in ENSAdmin: ", err);
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "name":
        return "Name";
      case "category":
        return "Category";
      case "recent":
        return "Recent";
      default:
        return "Name";
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 xl:pt-32">
        <div className="">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Examples</h1>
          <p className="text-xl text-gray-600">
            Explore our collection of GraphQL queries for the ENS subgraph.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sticky top-14 py-8">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search queries
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search queries by name or description..."
              />
            </div>
          </div>

          <div className="sm:w-48">
            <label htmlFor="sort" className="sr-only">
              Sort by
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>

              <button
                onClick={() => setSelectedCategory("")}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium mb-2 transition-colors ${
                  selectedCategory === ""
                    ? "bg-blue-100 text-[var(--color-primary)] border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100 border border-transparent"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>All Categories</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {examples.length}
                  </span>
                </div>
              </button>

              <div className="space-y-1">
                {categories.map(({ name, count }) => (
                  <button
                    key={name}
                    onClick={() => setSelectedCategory(name)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === name
                        ? "bg-blue-100 text-[var(--color-primary)] border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory("")}
                  className="w-full mt-4 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                {filteredExamples.length === examples.length ? (
                  <>Showing all {filteredExamples.length} queries</>
                ) : (
                  <>
                    Showing {filteredExamples.length} of {examples.length} queries
                    {selectedCategory && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[var(--color-primary)]">
                        {selectedCategory}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            {filteredExamples.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredExamples.map((example) => (
                  <QueryCard
                    key={example.id}
                    example={example}
                    onOpenInENSAdmin={handleOpenInENSAdmin}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.9-6.172-2.172M15 21H3a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v16a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No queries found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface QueryCardProps {
  example: SavedQuery;
  onOpenInENSAdmin: (query: string, variables: string) => void;
}

const QueryCard: React.FC<QueryCardProps> = ({ example, onOpenInENSAdmin }) => {
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleInspect = () => {
    const slug = slugify(example.name);
    window.location.href = `/examples/${slug}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col p-6">
      <div className="mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[var(--color-primary)]">
          {example.category}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{example.name}</h3>

      <p className="text-gray-600 text-sm mb-6 overflow-ellipsis line-clamp-3">
        {example.description}
      </p>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleInspect}
          className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="sr-only">Inspect</span>
        </button>

        <button
          onClick={() => onOpenInENSAdmin(example.query, example.variables)}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-primary)] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Open in ENSAdmin
        </button>
      </div>
    </div>
  );
};

export default ExamplesPage;

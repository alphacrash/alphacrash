const exercises = [
  {
    lesson_no: 1,
    name: "Introduction to SQL",
    description: `SQL (Structured Query Language) is a standard language for managing and manipulating relational databases. In this introductory lesson, you'll learn about:
  
  • Basic SQL syntax and structure
  • How to retrieve data using SELECT statements
  • Understanding database tables and relationships
  • Best practices for writing SQL queries
  
  Get ready to start your journey into the world of database management!`,
    tasks: [],
    tables: [
      {
        name: "pixar",
        schema: [
          ["id", "INTEGER"],
          ["title", "TEXT"],
          ["year", "INTEGER"],
          ["director", "TEXT"],
          ["rating", "REAL"],
        ],
        sampleData: [
          {
            id: 1,
            title: "Toy Story",
            year: 1995,
            director: "John Lasseter",
            rating: 8.3,
          },
          {
            id: 2,
            title: "A Bug's Life",
            year: 1998,
            director: "John Lasseter",
            rating: 7.2,
          },
          {
            id: 3,
            title: "Toy Story 2",
            year: 1999,
            director: "John Lasseter",
            rating: 7.9,
          },
        ],
      },
      {
        name: "directors",
        schema: [
          ["id", "INTEGER"],
          ["name", "TEXT"],
          ["birth_year", "INTEGER"],
          ["nationality", "TEXT"],
        ],
        sampleData: [
          {
            id: 1,
            name: "John Lasseter",
            birth_year: 1957,
            nationality: "American",
          },
          {
            id: 2,
            name: "Brad Bird",
            birth_year: 1957,
            nationality: "American",
          },
          {
            id: 3,
            name: "Pete Docter",
            birth_year: 1968,
            nationality: "American",
          },
        ],
      },
    ],
  },
  {
    lesson_no: 2,
    name: "Basics of SQL",
    description:
      "Let's get started with some basics - you'll learn how to retrieve data from a database using SQL SELECT statements.",
    tasks: [
      {
        id: 1,
        text: "Find the movie name with id equal to 2",
        solution: "SELECT title FROM pixar WHERE id = 2",
      },
      {
        id: 2,
        text: "Find name and year of the movies released in the years between 2000 and 2010",
        solution:
          "select title, year from pixar where year between 2000 and 2010",
      },
      {
        id: 3,
        text: "Find name and year of movies not released in the years between 2000 and 2010",
        solution:
          "select title, year from pixar where year not between 2000 and 2010",
      },
      {
        id: 4,
        text: "Find the first 5 Pixar movies and their release year",
        solution: "select title, year from pixar limit 5",
      },
    ],
    tables: [
      {
        name: "pixar",
        schema: [
          ["id", "INTEGER"],
          ["title", "TEXT"],
          ["year", "INTEGER"],
          ["director", "TEXT"],
          ["rating", "REAL"],
        ],
        sampleData: [
          {
            id: 1,
            title: "Toy Story",
            year: 1995,
            director: "John Lasseter",
            rating: 8.3,
          },
          {
            id: 2,
            title: "A Bug's Life",
            year: 1998,
            director: "John Lasseter",
            rating: 7.2,
          },
          {
            id: 3,
            title: "Toy Story 2",
            year: 1999,
            director: "John Lasseter",
            rating: 7.9,
          },
        ],
      },
      {
        name: "directors",
        schema: [
          ["id", "INTEGER"],
          ["name", "TEXT"],
          ["birth_year", "INTEGER"],
          ["nationality", "TEXT"],
        ],
        sampleData: [
          {
            id: 1,
            name: "John Lasseter",
            birth_year: 1957,
            nationality: "American",
          },
          {
            id: 2,
            name: "Brad Bird",
            birth_year: 1957,
            nationality: "American",
          },
          {
            id: 3,
            name: "Pete Docter",
            birth_year: 1968,
            nationality: "American",
          },
        ],
      },
    ],
  },
];

export default exercises;

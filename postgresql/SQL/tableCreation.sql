create table Pantry.Account(
	ID	SERIAL PRIMARY KEY NOT NULL,
	EmailAddress TEXT NOT NULL,
	Password TEXT NOT NULL,
	CreationDate date default NOW()
);

create table Pantry.Pantry(
	ID	SERIAL PRIMARY KEY NOT NULL,
	AccountID INTEGER REFERENCES Pantry.Account (ID)
);
create table Pantry.Product(
	ID	TEXT PRIMARY KEY NOT NULL,
	PantryID INTEGER REFERENCES Pantry.Pantry (ID),
	Title TEXT NOT NULL,
	CategoryID INTEGER REFERENCES Pantry.Category (ID),
	TabID TEXT REFERENCES Pantry.Tab (ID),
	ExpirationDate DATE NOT NULL,
	Quantity INTEGER NOT NULL,
	Unit TEXT DEFAULT 'unit'
);

create table Pantry.Tab(
	ID TEXT PRIMARY KEY NOT NULL,
	AccountID INTEGER REFERENCES Pantry.Account (ID),
	Location TEXT NOT NULL
);

create table Pantry.Category(
	ID	SERIAL PRIMARY KEY NOT NULL,
	Title TEXT NOT NULL
);
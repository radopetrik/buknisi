# Change: Add Sub-Categories

## Why
Currently, the system only supports a single level of categorization (`categories`). To provide better filtering and organization for users, we need to introduce a second level of categorization (`sub_categories`) that is linked to the main category.

## What Changes
- **Database Schema**:
  - Create new `sub_categories` table with `category_id` FK.
  - Add `sub_category_id` column to `companies` table (optional, or many-to-many? Assuming 1 company -> 1 sub-category for now based on "field", but could be many. "field" usually implies singular column. I will assume singular FK `sub_category_id` on `companies`).
- **Data Model**:
  - Define relationship: Category has many SubCategories.
  - Company belongs to Category (existing) and SubCategory (new, optional).

## Impact
- **Database**: New table `sub_categories`, modification to `companies`.
- **Apps**: All apps consuming company data will need to handle the new field.

## ADDED Requirements
### Requirement: Company Sub-Categorization
The system SHALL support a second level of categorization for companies.

#### Scenario: Sub-category definition
- **WHEN** a category exists
- **THEN** it can have multiple sub-categories

#### Scenario: Company assignment
- **WHEN** creating or updating a company
- **THEN** a sub-category can be assigned (filtered by the selected main category)

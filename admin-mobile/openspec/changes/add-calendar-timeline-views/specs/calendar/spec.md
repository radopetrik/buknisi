## ADDED Requirements

### Requirement: Calendar View Modes
The system SHALL provide calendar view modes: `agenda`, `day`, `week`, and `month`.

#### Scenario: User switches view mode
- **GIVEN** the user is on the `Kalendár` screen
- **WHEN** the user selects a view mode (`agenda|day|week|month`)
- **THEN** the calendar renders the selected view mode
- **AND** the selected view mode remains active until the user changes it

### Requirement: Agenda Infinite List
The system SHALL show an agenda view with a continuously scrollable list of bookings starting from today (inclusive) into the future.

#### Scenario: Agenda groups bookings by day
- **GIVEN** the user is viewing `agenda`
- **WHEN** bookings exist across multiple dates
- **THEN** the bookings are grouped under day headers (e.g. `Pondelok, 16. január`)
- **AND** the list remains a single continuous scroll

#### Scenario: Agenda loads more future bookings
- **GIVEN** the user is viewing `agenda`
- **WHEN** the user scrolls near the end of the loaded list
- **THEN** the system loads the next page of future bookings

### Requirement: Timeline Calendar (Day/Week)
The system SHALL provide day and week timeline views that render bookings on a time grid.

#### Scenario: Day view shows bookings positioned by time
- **GIVEN** the user is viewing `day`
- **WHEN** bookings exist for the selected date
- **THEN** bookings are rendered as blocks positioned by `time_from` and `time_to`

#### Scenario: Week view shows bookings positioned by time
- **GIVEN** the user is viewing `week`
- **WHEN** bookings exist for the selected week
- **THEN** bookings are rendered on a week time grid

### Requirement: Bookings Filter
The system SHALL provide a bookings filter for calendar views with options: `mine` (default), `all`, a specific staff member, and `unassigned`.

#### Scenario: Default filter is mine
- **GIVEN** the user opens the `Kalendár` screen
- **WHEN** no filter was explicitly selected in the current session
- **THEN** the system selects filter `mine`
- **AND** only bookings where `bookings.user_id = auth.uid()` are displayed

#### Scenario: User selects a bookings filter option
- **GIVEN** the user is on the `Kalendár` screen
- **WHEN** the user selects a bookings filter option
- **THEN** bookings shown in all calendar views are filtered accordingly

#### Scenario: Unassigned filter
- **GIVEN** some bookings have `staff_id = null`
- **WHEN** the user selects `unassigned`
- **THEN** only bookings without assigned staff are displayed

### Requirement: Month View
The system SHALL provide a month view that allows selecting a date and indicating dates with bookings.

#### Scenario: Month indicates booking days
- **GIVEN** the user is viewing `month`
- **WHEN** there are bookings within the visible month
- **THEN** the UI indicates days which have at least one booking

#### Scenario: Month date selection
- **GIVEN** the user is viewing `month`
- **WHEN** the user selects a date
- **THEN** the selected date becomes the active date for `day` view navigation

- category
	- name
	- order (int)

- city
	- name

- company 
    - name (text)
    - phone 
    - email (email)
    - slug (text)
	- category FK
	- address GPS (gps)
	- address_text (text)
	- description (text)
	- city FK
	- review rank (int)
	- contact_phone 
	- facebook (url)
	- instagram (url)
    - website (url)
    - is_mobile (bool)
    
- company_user
    - company FK
    - user FK


- amenities
	- name 
	- icon

- company_amenities
	- company FK
	- amenities FK


- company_business_hours
	- company FK
	- day_in_week (Monday-Sunday)
	- from_time
	- to_time
	- break_from_time
	- break_to_time

- company_business_hours_extra
	- date (date)
	- message
	- from_hour
	- to_hour
	- break_from
	- break_to
	

- staff
	- company FK
	- full name
	- photo
    - role (basic, staffer, reception, manager)
    - position (test)
    - available_for_booking
    - description

- staff_service
    - staff FK
    - service FK


- staff_time_off
    - staff FK
    - all_day (bool)
    - day (date)
    - from_time (null=True, time)
    - to_time (null=True, time)
    - reason (sick day, vacation, training)

- staff_working_hours
    - sraff FK
    - day_in_week (Monday-Sunday)
    - from_time (time)
    - to_time (time)
    - break_from_time (time)
    - break_to_time (time)

- photos
	- company FK
	- order (int)
	- url (url)


- client
	- first_name (text)
	- last_name (text)
	- phone
	- email (email)



- service_type_category    
	- name (text)

- service_type
    - service_type_category FK
	- name (text)


- service_category
    - name (text)
    - company FK

- service
	- name (text)
	- company FK
	- price (double)
    - price_type (ciselnik - Fixed, Free, Don't show, Start's at)
	- service_type FK
    - service_category FK
	- duration (min)
	- is_mobile (bool)
    - service_category (null=True, FK)
    - photo (file)

- addon
    - name
    - company FK
    - price     
    - duration (minutes, int)
    - description (text)
    - photo (file)

- service_addon
    - service FK
    - addon FK


- order
	- client FK (null allowed)
	- company FK
	- service FK
	- date
	- time_from
	- time_to
	- internal_note
	- client_note
    - staffer FK


- order_service
    - order FK
    - service FK
    
- order_service_addon
    - order_service FK
    - addon FK
    - count (int)

- reservation
    - date (date)
    - from_time (time)
    - to_time (time)
    - staffer (FK)
    - description

- review
	- company FK
	- client FK



import pandas as pd
import numpy as np
from faker import Faker
import random
import os

# Initialize Faker and set seeds for reproducibility
fake = Faker()
Faker.seed(42)
np.random.seed(42)

# Configurable parameters
NUM_ESTABLISHMENTS = 1000  # Number of establishments
NUM_CASES = 500_000        # Number of cases
NUM_ALERTS = 50_000        # Number of alerts

symptoms = [
        "Fatigue", "Fever", "Chills", "Weakness", "Weight loss", "Weight gain", "Sweating", 
        "Night sweats", "Excessive sweating", "Dizziness", "Nausea", "Vomiting", "Appetite loss", 
        "Excessive hunger", "Thirst", "Excessive thirst", "Polydipsia", "Sleep disturbances", 
        "Insomnia", "Hypersomnia", "Tremors", "Body aches", "Joint pain", "Muscle cramps", 
        "Muscle weakness", "Rash", "Itching", "Pruritus", "Redness", "Swelling", "Edema", 
        "Abdominal pain", "Headache", "Chest pain", "Shortness of breath", "Cough", "Wheezing", 
        "Runny nose", "Rhinorrhea", "Nasal congestion", "Sore throat", "Hoarseness", "Ear pain", 
        "Ear discharge", "Blurred vision", "Dry eyes", "Eye pain", "Sensitivity to light", 
        "Frequent urination", "Painful urination", "Blood in urine", "Constipation", "Diarrhea", 
        "Stomach cramps", "Back pain", "Heart palpitations", "Anxiety", "Depression", "Mood swings", 
        "Memory loss", "Confusion", "Hallucinations", "Seizures", "Numbness", "Tingling", 
        "Skin discoloration", "Bruising", "Hair loss", "Yellowing of the skin", "Jaundice", 
        "Dry mouth", "Bad breath", "Metallic taste", "Swollen lymph nodes", "Difficulty swallowing", 
        "Chest tightness", "Heartburn", "Indigestion", "Gas", "Bloating", "Frequent infections", 
        "Muscle stiffness", "Joint stiffness", "Difficulty moving", "Pain in extremities", 
        "Cold hands", "Cold feet", "Sensitivity to cold", "Sensitivity to heat", 
        "High blood pressure", "Low blood pressure", "Rapid heartbeat", "Slow heartbeat", 
        "Blurred vision", "Double vision", "Loss of vision", "Hearing loss", "Ringing in ears"
]

restaurant_data = {
    "McDonald's": {
        "type": "Fast Food",
        "foods": ["Big Mac", "Quarter Pounder", "Chicken McNuggets", "French Fries", 
                  "McChicken", "Filet-O-Fish", "Apple Pie", "McFlurry"]
    },
    "Subway": {
        "type": "Fast Food",
        "foods": ["Italian BMT", "Tuna Sub", "Turkey Breast Sub", "Meatball Marinara", 
                  "Veggie Delite", "Cold Cut Combo", "Sweet Onion Chicken Teriyaki"]
    },
    "Chipotle": {
        "type": "Fast Casual",
        "foods": ["Burrito Bowl", "Chicken Burrito", "Steak Burrito", "Carnitas Bowl",
                  "Guacamole", "Chicken Tacos", "Rice and Beans", "Salad Bowl"]
    },
    "Burger King": {
        "type": "Fast Food",
        "foods": ["Whopper", "Chicken Sandwich", "French Fries", "Onion Rings",
                  "Chicken Fries", "Hamburger", "Cheeseburger"]
    },
    "Wendy's": {
        "type": "Fast Food",
        "foods": ["Dave's Single", "Baconator", "Chicken Nuggets", "French Fries",
                  "Frosty", "Chicken Sandwich", "Salad"]
    },
    "Taco Bell": {
        "type": "Fast Food",
        "foods": ["Crunchy Taco", "Burrito Supreme", "Quesadilla", "Nachos",
                  "Mexican Pizza", "Crunchwrap Supreme", "Bean Burrito"]
    }
}

# Function to choose random restaurant and foods
def get_random_restaurant_and_foods():
    restaurant = random.choice(list(restaurant_data.keys()))
    food_options = restaurant_data[restaurant]["foods"]
    num_foods = random.randint(1, 3)
    selected_foods = random.sample(food_options, num_foods)
    return restaurant, ", ".join(selected_foods)

# Helper function to generate random severity and statuses
def random_severity():
    return random.choice(["Low", "Medium", "High"])

def random_status():
    return random.choice(["Confirmed", "Under Review", "Closed"])

# Generate Establishments Data
def generate_establishments(num):
    data = []
    for i in range(1, num + 1):
        data.append([
            i,  # id
            fake.company(),  # name
            fake.street_address(),  # address
            fake.city(),  # city
            fake.state_abbr(),  # state
            fake.postcode(),  # postal_code
            round(fake.latitude(), 6),  # latitude
            round(fake.longitude(), 6),  # longitude
            fake.date_time_this_year()  # created_at
        ])
    return pd.DataFrame(data, columns=[
        "id", "name", "address", "city", "state", 
        "postal_code", "latitude", "longitude", "created_at"
    ])

# Generate Cases Data
def generate_cases(num, establishment_ids):
    data = []
    for i in range(1, num + 1):
        random_symptoms = random.sample(symptoms, random.randint(1, 3))
        random_food = get_random_restaurant_and_foods()
        establishment_id = random.choice(establishment_ids)
        onset_date = fake.date_time_this_year()
        report_date = fake.date_time_between_dates(onset_date)
        data.append([
            i,  # id
            establishment_id,  # establishment_id
            report_date,  # report_date
            onset_date,  # onset_date
            #", ".join(fake.words(nb=3)),  # symptoms
            ", ".join(random_symptoms),  # symptoms
            #", ".join(fake.words(nb=2)),  # foods_consumed
            ", ".join(random_food),  # foods_consumed
            random.randint(1, 10),  # patient_count
            random_status(),  # status
            fake.date_time_this_year()  # created_at
        ])
    return pd.DataFrame(data, columns=[
        "id", "establishment_id", "report_date", "onset_date", 
        "symptoms", "foods_consumed", "patient_count", 
        "status", "created_at"
    ])

# Generate Alerts Data
def generate_alerts(num, establishment_ids):
    data = []
    for i in range(1, num + 1):
        establishment_id = random.choice(establishment_ids)
        data.append([
            i,  # id
            establishment_id,  # establishment_id
            random.choice(["Health Inspection", "Customer Complaint"]),  # alert_type
            random_severity(),  # severity
            random.randint(1, 20),  # case_count
            fake.text(max_nb_chars=50),  # details
            fake.date_time_this_year()  # created_at
        ])
    return pd.DataFrame(data, columns=[
        "id", "establishment_id", "alert_type", "severity", 
        "case_count", "details", "created_at"
    ])

# Main function to generate and save data
def generate_and_save_data():
    print("Generating establishments...")
    establishments = generate_establishments(NUM_ESTABLISHMENTS)
    establishments.to_csv("./data_create/data/establishments.csv", index=False)
    print(f"Generated {len(establishments)} establishments.")

    print("Generating cases...")
    cases = generate_cases(NUM_CASES, establishments["id"].tolist())
    cases.to_csv("./data_create/data/cases.csv", index=False)
    print(f"Generated {len(cases)} cases.")

    print("Generating alerts...")
    alerts = generate_alerts(NUM_ALERTS, establishments["id"].tolist())
    alerts.to_csv("./data_create/data/alerts.csv", index=False)
    print(f"Generated {len(alerts)} alerts.")

# Run the script
if __name__ == "__main__":
    generate_and_save_data()

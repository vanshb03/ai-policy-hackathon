import os
import pandas as pd
import random
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Faker and set random seeds for reproducibility
fake = Faker()
Faker.seed(42)
np.random.seed(42)

# Configurable parameters
NUM_ESTABLISHMENTS = 100 # Number of establishments
NUM_CASES = 50_000        # Number of cases
NUM_ALERTS = 5_000        # Number of alerts
DAYS = 90                  # Days to gen data for

# Data for restaurant chains, symptoms, and cities
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
        "Cold hands", "Cold feet", "Sensitivity to cold", "Sensitivity to heat", "Dehydration",
        "High blood pressure", "Low blood pressure", "Rapid heartbeat", "Slow heartbeat", 
        "Blurred vision", "Double vision", "Loss of vision", "Hearing loss", "Ringing in ears"
]

cities = [
    {"city": "New York", "state": "NY", "base_lat": 40.7128, "base_lng": -74.0060, "zip_prefix": "100"},
    {"city": "Los Angeles", "state": "CA", "base_lat": 34.0522, "base_lng": -118.2437, "zip_prefix": "900"},
    {"city": "Chicago", "state": "IL", "base_lat": 41.8781, "base_lng": -87.6298, "zip_prefix": "606"},
    {"city": "Houston", "state": "TX", "base_lat": 29.7604, "base_lng": -95.3698, "zip_prefix": "770"},
    {"city": "Phoenix", "state": "AZ", "base_lat": 33.4484, "base_lng": -112.0740, "zip_prefix": "850"}
]

# Helper function to generate addresses
def generate_address():
    street_number = random.randint(1, 9999)
    street_name = random.choice(["Main", "Park", "Broadway", "Washington"])
    street_type = random.choice(["St", "Ave", "Blvd", "Rd"])
    return f"{street_number} {street_name} {street_type}"

# Helper functions for random data generation
def random_severity():
    return random.choice(["Low", "Medium", "High"])

def random_status():
    return random.choice(["Confirmed", "Under Review", "Resolved"])

def get_random_foods(chain):
    return random.sample(restaurant_data[chain]["foods"], k=random.randint(1, 2))

class RestaurantDataGenerator:
    def __init__(self, days=DAYS):
        self.start_date = datetime.now() - timedelta(days=days)
        self.days = days

    def generate_establishments(self):
        establishments = []
        for _ in range(NUM_ESTABLISHMENTS):
            chain = random.choice(list(restaurant_data.keys()))
            city_info = random.choice(cities)
            establishment = {
                "name": chain,
                "address": generate_address(),
                "city": city_info["city"],
                "state": city_info["state"],
                "postal_code": f"{city_info['zip_prefix']}{random.randint(10, 9999)}",
                "latitude": round(city_info["base_lat"] + random.uniform(-0.1, 0.1), 6),
                "longitude": round(city_info["base_lng"] + random.uniform(-0.1, 0.1), 6)
            }
            establishments.append(establishment)
        result = supabase.table('establishments').insert(establishments).execute()
        return [entry["id"] for entry in result.data]

    def generate_cases_and_alerts(self, establishment_ids):
        for day in range(self.days):
            current_date = self.start_date + timedelta(days=day)
            is_outbreak = random.random() < 0.1  # 10% chance of outbreak

            if is_outbreak:
                self.create_outbreak(current_date, establishment_ids)
            else:
                self.create_regular_cases(current_date, establishment_ids)

    def create_outbreak(self, date, establishment_ids):
        establishment_id = random.choice(establishment_ids)
        chain = self.get_chain(establishment_id)
        foods = get_random_foods(chain)
        duration = random.randint(5, 14)
        
        alert = {
            "establishment_id": establishment_id,
            "alert_type": "OUTBREAK",
            "severity": "HIGH",
            "case_count": duration * 10,
            "details": f"Outbreak linked to {foods[0]}",
            "created_at": date.isoformat()
        }
        supabase.table('alerts').insert(alert).execute()

        for _ in range(duration):
            self.create_case(date, establishment_id, foods, outbreak=True)

    def create_regular_cases(self, date, establishment_ids):
        for _ in range(random.randint(5, 15)):
            establishment_id = random.choice(establishment_ids)
            foods = get_random_foods(self.get_chain(establishment_id))
            self.create_case(date, establishment_id, foods)

    def create_case(self, date, establishment_id, foods, outbreak=False):
        symptoms_sample = random.sample(symptoms, random.randint(2, 4))
        case = {
            "establishment_id": establishment_id,
            "report_date": date.isoformat(),
            "onset_date": (date - timedelta(days=random.randint(1, 3))).isoformat(),
            "symptoms": symptoms_sample,
            "foods_consumed": foods,
            "patient_count": random.randint(1, 5),
            "status": "confirmed" if outbreak else random_status(),
            "created_at": datetime.now().isoformat()
        }
        supabase.table('cases').insert(case).execute()

    def get_chain(self, establishment_id):
        result = supabase.table('establishments').select("name").eq("id", establishment_id).single().execute()
        return result.data["name"]
    
def main():
    generator = RestaurantDataGenerator()
    print("Generating establishments...")
    establishment_ids = generator.generate_establishments()
    print("Generating cases and alerts...")
    generator.generate_cases_and_alerts(establishment_ids)
    print("Data generation complete!")

if __name__ == "__main__":
    main()
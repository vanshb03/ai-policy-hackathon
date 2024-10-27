import os
from datetime import datetime, timedelta
import random
from typing import List, Dict
from supabase import create_client
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)

class RestaurantDataGenerator:
    def __init__(self, start_date=None, days=90):
        self.start_date = start_date or (datetime.now() - timedelta(days=days))
        self.days = days
        
        # Restaurant chains and their typical menu items
        self.restaurant_data = {
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
        
        self.symptoms = [
    "nausea", "vomiting", "diarrhea", "abdominal pain", "fever",
    "headache", "muscle aches", "fatigue", "dehydration",
    "stomach cramps", "bloody diarrhea", "chills", "loss of appetite",
    "dizziness", "weakness", "sweating", "bloating", "gas",
    "low-grade fever", "dry mouth", "malaise", "heartburn",
    "difficulty swallowing", "excessive thirst"
        ]

        # Updated cities with bounding boxes that exclude water bodies
        self.cities = [
                {
            "city": "Washington",
            "state": "DC",
            "zip_prefix": "200",
            "bounds": {
                # DC downtown/Georgetown, avoiding Potomac River
                "lat_min": 38.8900,
                "lat_max": 38.9100,
                "lng_min": -77.0500,
                "lng_max": -77.0300
            }
        },
        {
            "city": "Arlington",
            "state": "VA",
            "zip_prefix": "222",
            "bounds": {
                # Clarendon/Ballston corridor
                "lat_min": 38.8800,
                "lat_max": 38.8900,
                "lng_min": -77.1100,
                "lng_max": -77.0900
            }
        },
        {
            "city": "Alexandria",
            "state": "VA",
            "zip_prefix": "223",
            "bounds": {
                # Old Town, avoiding Potomac
                "lat_min": 38.8000,
                "lat_max": 38.8200,
                "lng_min": -77.0500,
                "lng_max": -77.0400
            }
        },
        {
            "city": "Bethesda",
            "state": "MD",
            "zip_prefix": "208",
            "bounds": {
                # Downtown Bethesda
                "lat_min": 38.9800,
                "lat_max": 38.9900,
                "lng_min": -77.1000,
                "lng_max": -77.0900
            }
        },
        {
            "city": "Silver Spring",
            "state": "MD",
            "zip_prefix": "209",
            "bounds": {
                # Downtown Silver Spring
                "lat_min": 38.9900,
                "lat_max": 39.0000,
                "lng_min": -77.0300,
                "lng_max": -77.0200
            }
        }
        ]

    def generate_address(self) -> str:
        street_numbers = random.randint(1, 9999)
        street_types = ["St", "Ave", "Blvd", "Rd", "Pkwy", "Dr"]
        street_names = ["Main", "Market", "Commercial", "Broadway", "Washington", "Park"]
        return f"{street_numbers} {random.choice(street_names)} {random.choice(street_types)}"

    def generate_coordinates(self, city_data):
        """Generate coordinates within the specified bounds for a city"""
        bounds = city_data["bounds"]
        lat = random.uniform(bounds["lat_min"], bounds["lat_max"])
        lng = random.uniform(bounds["lng_min"], bounds["lng_max"])
        return round(lat, 6), round(lng, 6)

    def generate_and_insert_establishments(self, num_establishments=100):
        establishments = []
        establishment_ids = []
        chains = list(self.restaurant_data.keys())
        
        # Distribute establishments across cities
        establishments_per_city = num_establishments // len(self.cities)
        remaining = num_establishments % len(self.cities)
        
        for city_data in self.cities:
            # Calculate number of establishments for this city
            city_establishments = establishments_per_city + (1 if remaining > 0 else 0)
            remaining = max(0, remaining - 1)
            
            for _ in range(city_establishments):
                chain = random.choice(chains)
                lat, lng = self.generate_coordinates(city_data)
                postal_code = f"{city_data['zip_prefix']}{random.randint(10, 99)}"
                
                establishment = {
                    "name": chain,
                    "address": self.generate_address(),
                    "city": city_data["city"],
                    "state": city_data["state"],
                    "postal_code": postal_code,
                    "latitude": lat,
                    "longitude": lng
                }
                establishments.append(establishment)
        
        # Insert establishments in batches of 50
        for i in range(0, len(establishments), 50):
            batch = establishments[i:i+50]
            result = supabase.table('establishments').insert(batch).execute()
            establishment_ids.extend([r['id'] for r in result.data])
            
        return establishment_ids

    def generate_and_insert_cases_and_alerts(self, establishment_ids):
        for day in range(self.days):
            current_date = self.start_date + timedelta(days=day)
            month = current_date.month
            season_multiplier = 1.5 if month in [6, 7, 8] else 1.0
            base_cases = int(random.normalvariate(5, 2) * season_multiplier)
            
            # Generate outbreak pattern
            if random.random() < 0.1:  # 10% chance of outbreak
                outbreak_duration = random.randint(5, 14)
                establishment_id = random.choice(establishment_ids)
                
                # Get the establishment's chain
                establishment = supabase.table('establishments').select('name').eq('id', establishment_id).single().execute()
                chain = establishment.data['name']
                outbreak_foods = random.sample(self.restaurant_data[chain]["foods"], k=random.randint(1, 2))
                
                # Create alert for outbreak
                alert_data = {
                    "establishment_id": establishment_id,
                    "alert_type": "OUTBREAK",
                    "severity": "HIGH",
                    "case_count": base_cases * outbreak_duration,
                    "details": f"Multiple cases linked to {outbreak_foods[0]}"
                }
                supabase.table('alerts').insert(alert_data).execute()
                
                # Generate outbreak cases
                outbreak_cases = []
                for i in range(outbreak_duration):
                    outbreak_date = current_date + timedelta(days=i)
                    case_count = int(random.normalvariate(base_cases * 2, base_cases/2))
                    outbreak_symptoms = random.sample(self.symptoms, k=random.randint(3, 5))
                    
                    case = {
                        "establishment_id": establishment_id,
                        "report_date": outbreak_date.isoformat(),
                        "onset_date": (outbreak_date - timedelta(days=random.randint(1,3))).isoformat(),
                        "symptoms": outbreak_symptoms,
                        "foods_consumed": outbreak_foods,
                        "patient_count": case_count,
                        "status": "confirmed"
                    }
                    outbreak_cases.append(case)
                
                # Insert outbreak cases in batches
                for i in range(0, len(outbreak_cases), 50):
                    batch = outbreak_cases[i:i+50]
                    supabase.table('cases').insert(batch).execute()
            
            # Generate regular cases
            regular_cases = []
            for _ in range(base_cases):
                establishment_id = random.choice(establishment_ids)
                establishment = supabase.table('establishments').select('name').eq('id', establishment_id).single().execute()
                chain = establishment.data['name']
                
                foods = random.sample(self.restaurant_data[chain]["foods"], k=random.randint(1, 2))
                symptoms = random.sample(self.symptoms, k=random.randint(2, 4))
                
                case = {
                    "establishment_id": establishment_id,
                    "report_date": current_date.isoformat(),
                    "onset_date": (current_date - timedelta(days=random.randint(1,3))).isoformat(),
                    "symptoms": symptoms,
                    "foods_consumed": foods,
                    "patient_count": random.randint(1,3),
                    "status": random.choice(['suspected', 'confirmed', 'resolved'])
                }
                regular_cases.append(case)
                
                # Generate alerts for severe cases
                if random.random() < 0.05:
                    alert_data = {
                        "establishment_id": establishment_id,
                        "alert_type": "SEVERE_CASE",
                        "severity": "HIGH",
                        "case_count": 1,
                        "details": f"Severe reaction reported to {foods[0]}"
                    }
                    supabase.table('alerts').insert(alert_data).execute()
            
            # Insert regular cases in batches
            for i in range(0, len(regular_cases), 50):
                batch = regular_cases[i:i+50]
                supabase.table('cases').insert(batch).execute()

def main():
    generator = RestaurantDataGenerator()
    
    # Generate and insert establishments
    print("Generating establishments...")
    establishment_ids = generator.generate_and_insert_establishments(100)
    
    # Generate and insert cases and alerts
    print("Generating cases and alerts...")
    generator.generate_and_insert_cases_and_alerts(establishment_ids)
    
    print("Data generation complete!")

if __name__ == "__main__":
    main()
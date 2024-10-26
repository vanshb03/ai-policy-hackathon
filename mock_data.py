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
    'https://afotjpglixpezmmbvujc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb3RqcGdsaXhwZXptbWJ2dWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5Njc2MzUsImV4cCI6MjA0NTU0MzYzNX0.vV4muwqOKn0SQ1O3FaGdnct8ZULRhxZSCoU9mWG07XM'
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
            "headache", "muscle aches", "fatigue", "dehydration"
        ]
        
        self.cities = [
            {"city": "New York", "state": "NY", "base_lat": 40.7128, "base_lng": -74.0060, "zip_prefix": "100"},
            {"city": "Los Angeles", "state": "CA", "base_lat": 34.0522, "base_lng": -118.2437, "zip_prefix": "900"},
            {"city": "Chicago", "state": "IL", "base_lat": 41.8781, "base_lng": -87.6298, "zip_prefix": "606"},
            {"city": "Houston", "state": "TX", "base_lat": 29.7604, "base_lng": -95.3698, "zip_prefix": "770"},
            {"city": "Phoenix", "state": "AZ", "base_lat": 33.4484, "base_lng": -112.0740, "zip_prefix": "850"}
        ]

    def generate_address(self) -> str:
        street_numbers = random.randint(1, 9999)
        street_types = ["St", "Ave", "Blvd", "Rd", "Pkwy", "Dr"]
        street_names = ["Main", "Market", "Commercial", "Broadway", "Washington", "Park"]
        return f"{street_numbers} {random.choice(street_names)} {random.choice(street_types)}"

    def generate_and_insert_establishments(self, num_establishments=100):
        establishments = []
        establishment_ids = []
        chains = list(self.restaurant_data.keys())
        
        for _ in range(num_establishments):
            chain = random.choice(chains)
            city_data = random.choice(self.cities)
            
            lat = city_data["base_lat"] + random.uniform(-0.1, 0.1)
            lng = city_data["base_lng"] + random.uniform(-0.1, 0.1)
            postal_code = f"{city_data['zip_prefix']}{random.randint(10, 99)}"
            
            establishment = {
                "name": chain,
                "address": self.generate_address(),
                "city": city_data["city"],
                "state": city_data["state"],
                "postal_code": postal_code,
                "latitude": round(lat, 8),
                "longitude": round(lng, 8)
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
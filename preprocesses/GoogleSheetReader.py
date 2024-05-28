import gspread
import pandas as pd

class GoogleSheetReader:
    def __init__(self, credentials_file, sheet_name):
        self.credentials_file = credentials_file
        self.sheet_name = sheet_name
        self.gc = None
        self.sheet = None

    def connect(self):
        try:
            self.gc = gspread.service_account(filename=self.credentials_file)
            self.sheet = self.gc.open(self.sheet_name).sheet1
            print("Connected to Google Sheet successfully!")
        except Exception as e:
            print("Failed to connect to Google Sheet:", e)

    def read_as_csv(self):
        if not self.sheet:
            print("Please connect to Google Sheet first.")
            return None

        try:
            # Get all values from the sheet
            values = self.sheet.get_all_values()

            # Convert to DataFrame
            df = pd.DataFrame(values[1:], columns=values[0])

            # Convert DataFrame to CSV string
            csv_data = df.to_csv(index=False)

            return csv_data
        except Exception as e:
            print("Failed to read Google Sheet as CSV:", e)
            return None

    def convert_to_json(self):
        csv_data = self.read_as_csv()
        if csv_data:
            try:
                # Convert CSV string to DataFrame
                df = pd.read_csv(pd.compat.StringIO(csv_data))

                # Convert DataFrame to JSON object
                json_data = df.to_json(orient='records')

                return json_data
            except Exception as e:
                print("Failed to convert CSV to JSON:", e)
                return None
        else:
            return None

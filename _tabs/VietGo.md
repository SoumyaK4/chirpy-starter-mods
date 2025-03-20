---
icon: fas fa-circle
order: 7
---

# Vietnam Go Association Rating System

A comprehensive player management and rating system for the Vietnam Go Association, featuring Glicko2 rating calculations, tournament management, and player profiles.

## Features

- **Player Management:** Create and edit player profiles with personal information and photos
- **Tournament Management:** Organize tournaments, create rounds, and manage matches
- **Enhanced Glicko2 Rating System:** Accurate player skill estimation with rating, deviation, volatility, and time-based rating aging
- **Automatic Rank Calculation:** Converts numerical ratings to traditional Go ranks (kyu/dan)
- **Match Result Tracking:** Record game results with standardized notation (B+R, W+3.5, etc.)
- **Rating History:** Visual graphs of rating changes over time for each player
- **Data Import/Export:** Backup and restore system data in JSON format with PostgreSQL database
- **Mobile-Friendly Design:** Responsive interface works on all devices
- **Dark Theme:** Eye-friendly dark interface with Go-themed elements
- **PWA Support:** Install as a standalone app with offline capabilities

## Table of Contents

- [Installation](#installation)
- [Admin Guide](#admin-guide)
- [Developer Guide](#developer-guide)
- [File Structure](#file-structure)
- [Technologies Used](#technologies-used)
- [License](#license)

## Installation

### Prerequisites

- Python 3.7+
- PostgreSQL database
- Flask and dependencies

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/vietnam-go-association/rating-system.git
   cd rating-system
   ```

2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   # Set up the PostgreSQL database connection string
   export DATABASE_URL="postgresql://username:password@localhost:5432/vietnam_go"
   
   # Set a secret key for session security
   export SESSION_SECRET="your-secret-key"
   ```

4. Run the application:
   ```bash
   python main.py
   ```

## Admin Guide

### Enhanced Glicko2 Rating System

The system implements an improved version of the Glicko2 rating algorithm with several enhancements:

- **Time-Based Rating Aging**: Players' rating deviations increase gradually over time when they are inactive, reflecting increased uncertainty about their skill level. The system caps maximum aging to prevent excessive RD for returning players.
- **Rating Uncertainty Indicators**: Visual indicators show when a player's rating is uncertain (high deviation) or when they haven't played recently, with color-coded warnings for different uncertainty levels.
- **Configurable Parameters**: System administrators can adjust rating constraints, volatility values, and aging period settings through a simple API.
- **Rating History Tracking**: Complete history of rating changes is stored and visualized with dual-axis charts for better data presentation.
- **Numerical Stability**: Improved mathematical algorithms ensure stability even with edge-case rating scenarios.

### Rating Parameters

- **Rating**: Numerical representation of player strength (default starting value: 1500)
- **Rating Deviation (RD)**: Measure of rating reliability (lower is more reliable)
  - **Default for new players**: 350
  - **Minimum value**: 30 (highly reliable rating)
  - **Maximum value**: 500 (maximum uncertainty)
- **Volatility**: Measure of expected rating fluctuation (range: 0.01 to 0.15)
- **Aging Period**: Time period after which an inactive player's RD reaches maximum value (default: 30 days)

### Player Management

### Tournament Administration

### Data Import/Export

The system provides comprehensive data management features with PostgreSQL:

- **Export Data**: Export all system data (players, tournaments, matches, ratings) as a single JSON file for backup or migration purposes
- **Import Data**: Restore system data from a previously exported JSON file
- **Data Reset**: Option to completely reset the system (requires confirmation)

#### PostgreSQL Database Management

This application uses PostgreSQL for robust database management. Unlike the previous SQLite version, database files are not directly accessible for import/export. Instead:

- Use the JSON export/import features for application data backup and migration
- For database-level operations, use PostgreSQL's native tools:
  - **Backup**: `pg_dump -U username -d vietnam_go > backup.sql`
  - **Restore**: `psql -U username -d vietnam_go < backup.sql`
  - **Administration**: Use tools like pgAdmin or DBeaver for direct database management

## Developer Guide

### Project Structure

```
vietnam-go-association/
├── app.py                  # Flask application setup and database configuration
├── main.py                 # Application entry point
├── models.py               # Database models and relationships
├── admin.py                # Admin dashboard and management functions
├── auth.py                 # Authentication and account management
├── forms.py                # Form definitions for data input
├── player.py               # Player management and profile routes
├── tournament.py           # Tournament and match management
├── glicko2.py              # Enhanced Glicko2 rating implementation
├── utils.py                # Utility functions for data processing
├── static/                 # Static assets (CSS, JS, images)
└── templates/              # HTML templates
```

### Rating System Implementation

The Glicko2 rating system is implemented in `glicko2.py` with several enhancements beyond the standard algorithm:

#### Time-Based Rating Aging

Players who haven't played in a while have increased rating deviations, reflecting growing uncertainty about their true skill level. This is implemented through:

1. Tracking of last played date for each player
2. Gradual increase of rating deviation based on time since last game
3. Visual indicators in the player list to show inactive or uncertain ratings

```python
def _age_rating_deviation(self, days: int) -> float:
    """
    Increase rating deviation based on time since last game.
    
    This implements an improved rating aging approach with the following features:
    1. Caps maximum aging to prevent excessive RD for returning players
    2. Uses a gradual aging curve for more accurate representation of uncertainty
    3. Respects system boundaries for rating deviations
    """
    if not AGING_PERIOD_DAYS:
        return self.rd
    
    if AGING_PERIOD_DAYS <= 0:
        return self.rd
        
    # Calculate aging factor with improved logic:
    # - For short absences (< aging period): linear increase
    # - For long absences (>= aging period): capped at 1.0 (one full period)
    aging_factor = min(1.0, days / AGING_PERIOD_DAYS)
    
    # For very long absences, apply a small additional penalty, but keep below MAX_RD
    if days >= 3 * AGING_PERIOD_DAYS:
        max_penalty = 0.8  # Maximum additional penalty as a fraction
        base_penalty = 0.2  # Base penalty for players inactive > 3 periods
        extra_periods = min(5, (days - 3 * AGING_PERIOD_DAYS) / AGING_PERIOD_DAYS)
        long_absence_penalty = base_penalty + (max_penalty - base_penalty) * (extra_periods / 5)
        
        # Add penalty but keep the total aging factor <= 1
        aging_factor = min(1.0, aging_factor + long_absence_penalty)
    
    # Convert to Glicko-2 scale, apply aging, and convert back
    phi = self.rd / GLICKO2_SCALE
    phi_prime = math.sqrt(phi**2 + aging_factor * self.vol**2)
    
    # Apply constraints
    return min(MAX_RD, max(MIN_RD, GLICKO2_SCALE * phi_prime))
```

#### Rating Constraints

The system enforces reasonable constraints on rating values to prevent mathematical anomalies:

- Rating: Limited between configurable minimum and maximum values
- Rating Deviation: Cannot go below a minimum threshold to avoid overconfidence
- Volatility: Constrained to reasonable bounds to prevent unstable behavior

#### Configuration Options

The rating system can be customized through the `configure_glicko2` function:

```python
configure_glicko2(
    min_rating=100.0,         # Minimum allowed rating
    max_rating=6000.0,        # Maximum allowed rating
    min_rd=30.0,              # Minimum allowed rating deviation
    max_rd=500.0,             # Maximum allowed rating deviation
    min_volatility=0.01,      # Minimum allowed volatility
    max_volatility=0.15,      # Maximum allowed volatility
    tau=0.5,                  # System volatility constraint
    aging_period_days=30      # Days until RD reaches maximum
)
```

### Visual Indicators

The system uses visual indicators to help users understand player ratings:

- 🟢 **Established Rating**: Player has played recently and has a low rating deviation
- 🟡 **Uncertain Rating**: Player has a moderate rating deviation (>110)
- 🔴 **High Uncertainty**: Player has a high rating deviation (>350)
- ⌛ **Inactive/New Player**: Player hasn't played in over 6 months

### Type Annotations

The implementation uses Python type annotations for better code documentation and to catch potential errors:

```python
def update_ratings(players: List[Tuple[int, float, float, float, Optional[datetime]]], 
                  matches: List[Tuple[int, int, float]], 
                  current_date: Optional[datetime] = None) -> Dict[int, Tuple[float, float, float, Optional[datetime]]]:
    """
    Update ratings for a batch of players based on match results.
    """
    # Implementation details...
```

## Technologies Used

- **Backend**: Python, Flask, SQLAlchemy
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript
- **UI Framework**: Bootstrap
- **Charts**: Chart.js
- **Authentication**: Flask-Login
- **Form Handling**: Flask-WTF
- **Markdown Support**: markdown2
- **PWA Features**: Service workers

## License

This project is licensed under the MIT License. See the LICENSE file for details.

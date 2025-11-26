import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Scrapes the "Best rating" from a player's GeoGuessr profile page
 * @param {string} userId - GeoGuessr user ID
 * @returns {Promise<number|null>} - Best rating or null if not found
 */
async function scrapeBestRating(userId) {
  let browser;
  try {
    console.log(`🔍 Scraping best rating for user: ${userId}`);
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set cookie for authentication
    const cookie = process.env.GEOGUESSR_COOKIE;
    if (cookie) {
      await page.setCookie({
        name: '_ncfa',
        value: cookie,
        domain: '.geoguessr.com'
      });
    }
    
    // Navigate to profile page
    const profileUrl = `https://www.geoguessr.com/user/${userId}`;
    console.log(`📍 Navigating to: ${profileUrl}`);
    
    await page.goto(profileUrl, { 
      waitUntil: 'domcontentloaded', // Changed from networkidle0 - faster
      timeout: 60000 // Increased timeout to 60s
    });
    
    console.log('⏳ Waiting for content to load...');
    
    // Wait for the division widget to load
    await page.waitForSelector('.widget_divisionValue__SVEHH', { timeout: 20000 });
    
    // Extract the "Best rating" value
    const bestRating = await page.evaluate(() => {
      // Find all divisionValue elements
      const divisionValues = document.querySelectorAll('.widget_divisionValue__SVEHH');
      
      for (const div of divisionValues) {
        const span = div.querySelector('span');
        if (span && span.textContent.includes('Best rating')) {
          const strong = div.querySelector('strong');
          if (strong) {
            return parseInt(strong.textContent, 10);
          }
        }
      }
      
      return null;
    });
    
    console.log(`✅ Best rating found: ${bestRating}`);
    
    return bestRating;
    
  } catch (error) {
    console.error(`❌ Error scraping best rating:`, error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test the scraper
async function testScraper() {
  const testUsers = [
    { name: 'Blinky', id: '5b51062a4010740f7cd91dd5' },
    { name: 'subi', id: '5e22e470e9473f68e8fdbd33' }
  ];
  
  for (const user of testUsers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${user.name}`);
    console.log('='.repeat(60));
    
    const bestRating = await scrapeBestRating(user.id);
    
    if (bestRating) {
      console.log(`🏆 ${user.name}'s best rating: ${bestRating}`);
    } else {
      console.log(`⚠️ Could not find best rating for ${user.name}`);
    }
  }
}

// Only run test if this file is executed directly (not imported)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('🚀 Starting scraper test...');
  testScraper()
    .then(() => {
      console.log('\n✅ Test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { scrapeBestRating };

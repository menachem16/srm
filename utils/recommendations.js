import { trickleListObjects, trickleCreateObject, trickleUpdateObject, trickleDeleteObject } from './database';

const RecommendationUtils = {
  generatePersonalizedRecommendations: async (user, allContent) => {
    try {
      const userRatings = await trickleListObjects(`rating:${user.objectId}`, 100, true);
      const userFavorites = await trickleListObjects(`favorites:${user.objectId}`, 100, true);
      const viewingHistory = await trickleListObjects(`viewing_history:${user.objectId}`, 50, true);
      
      const ratedContent = userRatings.items.map(r => ({
        contentId: r.objectData.contentId,
        rating: r.objectData.rating
      }));
      
      const favoriteContent = userFavorites.items
        .filter(f => f.objectData.type === 'favorites')
        .map(f => f.objectData.contentId);

      const watchedContent = viewingHistory.items.map(h => h.objectData.contentId);

      const userPreferences = RecommendationUtils.analyzeUserPreferences(
        ratedContent, favoriteContent, watchedContent, allContent
      );

      const systemPrompt = `אתה מערכת המלצות חכמה לפלטפורמת סטרימינג. נתח את העדפות המשתמש והמלץ על תכנים רלוונטיים.

העדפות המשתמש:
- קטגוריות מועדפות: ${userPreferences.preferredCategories.join(', ')}
- דירוג ממוצע: ${userPreferences.averageRating}
- שנים מועדפות: ${userPreferences.preferredYears.join(', ')}
- תכנים שנצפו: ${userPreferences.watchedCount}

רשימת תכנים זמינים:
${allContent.slice(0, 20).map(c => `${c.objectId}: ${c.objectData.title} (${c.objectData.category}, ${c.objectData.year}, דירוג: ${c.objectData.rating})`).join('\n')}

החזר רק רשימה של 8 מזהי תכנים (objectId) המומלצים ביותר, מופרדים בפסיקים.`;

      const userPrompt = 'המלץ על תכנים חדשים המתאימים למשתמש זה';
      
      const recommendations = await invokeAIAgent(systemPrompt, userPrompt);
      const contentIds = recommendations.split(',').map(id => id.trim());
      
      const recommendedContent = allContent.filter(content => 
        contentIds.includes(content.objectId) && 
        !watchedContent.includes(content.objectId)
      );
      
      return recommendedContent.length > 0 ? recommendedContent : allContent.slice(0, 8);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return allContent.slice(0, 8);
    }
  },

  analyzeUserPreferences: (ratings, favorites, watched, allContent) => {
    const ratedItems = ratings.filter(r => r.rating >= 4);
    const allUserContent = [...new Set([...ratedItems.map(r => r.contentId), ...favorites, ...watched])];
    
    const userContentData = allUserContent
      .map(id => allContent.find(c => c.objectId === id)?.objectData)
      .filter(Boolean);

    const categories = {};
    const years = {};
    let totalRating = 0;

    userContentData.forEach(content => {
      categories[content.category] = (categories[content.category] || 0) + 1;
      years[content.year] = (years[content.year] || 0) + 1;
    });

    ratings.forEach(r => totalRating += r.rating);

    return {
      preferredCategories: Object.keys(categories).sort((a, b) => categories[b] - categories[a]),
      preferredYears: Object.keys(years).sort((a, b) => years[b] - years[a]),
      averageRating: ratings.length > 0 ? (totalRating / ratings.length).toFixed(1) : 0,
      watchedCount: watched.length
    };
  }
};

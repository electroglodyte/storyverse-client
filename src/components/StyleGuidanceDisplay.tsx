import React from 'react';
import { StyleGuidance } from '@/types/style';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface StyleGuidanceDisplayProps {
  guidance: StyleGuidance[];
}

export const StyleGuidanceDisplay: React.FC<StyleGuidanceDisplayProps> = ({
  guidance,
}) => {
  // Group guidance by category
  const groupedGuidance = guidance.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, StyleGuidance[]>);

  // Sort categories by highest priority guidance within each category
  const sortedCategories = Object.entries(groupedGuidance)
    .sort(([, a], [, b]) => {
      const maxPriorityA = Math.max(...a.map(g => g.priority));
      const maxPriorityB = Math.max(...b.map(g => g.priority));
      return maxPriorityB - maxPriorityA;
    });

  return (
    <Accordion type="single" collapsible className="w-full">
      {sortedCategories.map(([category, items]) => (
        <AccordionItem key={category} value={category}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{category}</span>
              <Badge variant="secondary">
                {items.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {items
                .sort((a, b) => b.priority - a.priority)
                .map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">{item.guidance}</p>
                        <Badge className={`
                          ${item.priority >= 8 ? 'bg-red-100 text-red-800' : ''}
                          ${item.priority >= 5 && item.priority < 8 ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${item.priority < 5 ? 'bg-green-100 text-green-800' : ''}
                        `}>
                          Priority {item.priority}
                        </Badge>
                      </div>
                      {item.examples.length > 0 && (
                        <div className="bg-gray-50 rounded-md p-3 space-y-2">
                          <p className="text-sm font-medium text-gray-500">Examples:</p>
                          {item.examples.map((example, index) => (
                            <p key={index} className="text-sm">
                              {example}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};